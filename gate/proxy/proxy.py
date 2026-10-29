"""
MCP Gateway Proxy
=================
This is the **agent-facing** MCP server that the agent connects to.

For every tool call the agent makes:
  1. Normalise the call into a ToolCall record.
  2. Evaluate it through the gate engine (policy + session + risk).
  3. If ALLOW  → forward to the real tool server and return the result.
  4. If BLOCK  → return an error immediately (no forwarding).
  5. If REQUIRE_APPROVAL → park in the approval queue and wait.
  6. Write to the audit log regardless.

In Phase 1 the gate engine is a pass-through (everything is ALLOW) so we
can wire the plumbing and test the audit log.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.server.mcpserver import MCPServer
from mcp import types as mcp_types

from gate.models import Decision, GateVerdict, ToolCall
from gate.audit.log import AuditLog

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Path to the tool-server script (real downstream MCP server)
TOOL_SERVER_CMD = [
    sys.executable,
    "-m",
    "gate.proxy.tool_server",
]

# Audit log path
_DB_PATH = Path(os.environ.get("GATE_DB", "gate_audit.db"))


# ---------------------------------------------------------------------------
# Gate engine stub (Phase 1: always ALLOW)
# Phase 2+ will replace this with real policy evaluation.
# ---------------------------------------------------------------------------

async def evaluate_call(call: ToolCall) -> GateVerdict:
    """Placeholder gate engine.  Always allows in Phase 1."""
    return GateVerdict(
        call_id=call.call_id,
        decision=Decision.ALLOW,
        reason="phase-1-passthrough",
    )


# ---------------------------------------------------------------------------
# Proxy server
# ---------------------------------------------------------------------------

class GatewayProxy:
    """
    Manages the lifecycle of the downstream tool-server connection and
    exposes the same tools to the agent via an MCPServer.
    """

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        self._audit   = AuditLog(db_path)
        self._tools: list[mcp_types.Tool] = []
        self._session: ClientSession | None = None
        self._read  = None
        self._write = None
        self._cm    = None  # context manager for stdio_client

    # ------------------------------------------------------------------
    # Connect to downstream tool server
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """Spawn the downstream tool server and complete capability handshake."""
        params = StdioServerParameters(command=TOOL_SERVER_CMD[0], args=TOOL_SERVER_CMD[1:])
        self._cm = stdio_client(params)
        self._read, self._write = await self._cm.__aenter__()
        self._session = ClientSession(self._read, self._write)
        await self._session.__aenter__()
        await self._session.initialize()
        result = await self._session.list_tools()
        self._tools = result.tools
        print(
            f"[proxy] connected to tool-server; discovered tools: "
            f"{[t.name for t in self._tools]}",
            file=sys.stderr,
        )

    async def disconnect(self) -> None:
        if self._session:
            await self._session.__aexit__(None, None, None)
        if self._cm:
            await self._cm.__aexit__(None, None, None)
        self._audit.close()

    # ------------------------------------------------------------------
    # Forward a tool call after gate evaluation
    # ------------------------------------------------------------------

    async def handle_call(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        session_id: str,
        agent_id: str,
    ) -> str:
        """Gate-evaluate then forward or block a tool call."""
        call = ToolCall(
            session_id=session_id,
            agent_id=agent_id,
            tool=tool_name,
            arguments=arguments,
            timestamp=datetime.now(timezone.utc),
        )

        verdict = await evaluate_call(call)
        self._audit.append(call, verdict)

        if verdict.decision == Decision.BLOCK:
            return f"[BLOCKED by safety gate] {verdict.reason}"

        if verdict.decision == Decision.REQUIRE_APPROVAL:
            # Phase 4 will implement real waiting; for now deny if not approved
            return f"[PENDING APPROVAL] {verdict.reason}"

        # ALLOW – forward to the real tool server
        if self._session is None:
            return "ERROR: proxy not connected to tool server"

        try:
            result = await self._session.call_tool(tool_name, arguments=arguments)
            # Concatenate text content blocks
            parts = []
            for block in result.content:
                if hasattr(block, "text"):
                    parts.append(block.text)
                else:
                    parts.append(str(block))
            return "\n".join(parts) or "(empty)"
        except Exception as exc:
            return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Build the agent-facing MCPServer from discovered downstream tools
# ---------------------------------------------------------------------------

async def build_proxy_server(db_path: Path = _DB_PATH) -> tuple[MCPServer, GatewayProxy]:
    """
    Create and return an (MCPServer, GatewayProxy) pair.
    The MCPServer exposes all downstream tools and routes them through the gate.
    """
    proxy = GatewayProxy(db_path=db_path)
    await proxy.connect()

    server = MCPServer(name="agent-safety-gate", version="1.0.0")

    # Dynamically register one handler per downstream tool
    for tool in proxy._tools:
        _register_tool(server, proxy, tool)

    return server, proxy


def _register_tool(server: MCPServer, proxy: GatewayProxy, tool: mcp_types.Tool) -> None:
    """Register a single tool on the MCPServer that routes through the proxy."""
    tool_name   = tool.name
    tool_desc   = tool.description or ""
    tool_schema = tool.input_schema if hasattr(tool, "input_schema") else {}

    # We need a closure to capture tool_name
    async def _handler(**kwargs: Any) -> str:
        session_id = kwargs.pop("__session_id__", "default-session")
        agent_id   = kwargs.pop("__agent_id__",   "default-agent")
        return await proxy.handle_call(tool_name, kwargs, session_id, agent_id)

    _handler.__name__ = tool_name
    _handler.__doc__  = tool_desc

    server.add_tool(_handler, name=tool_name, description=tool_desc)


# ---------------------------------------------------------------------------
# Entry point  (run as stdio MCP server)
# ---------------------------------------------------------------------------

async def _main() -> None:
    server, proxy = await build_proxy_server()
    try:
        await server.run_stdio_async()
    finally:
        await proxy.disconnect()


if __name__ == "__main__":
    asyncio.run(_main())

