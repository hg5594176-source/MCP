"""
Stub tool server – acts as a real downstream MCP tool server.
Exposes four tools the demo agent can call:
  • file_read    – read a file path
  • file_write   – write content to a path
  • file_delete  – delete a file/directory
  • send_email   – email stub (logs only, no real mail)
  • http_request – HTTP stub (logs only, no real network)
  • send_payment – payment stub (logs only, no real transfer)
  • shell_exec   – shell execution stub (logs only)

Run with: python -m gate.proxy.tool_server
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from mcp.server.mcpserver import MCPServer

# ---------------------------------------------------------------------------
# Server definition
# ---------------------------------------------------------------------------

_server = MCPServer(name="tool-server", version="1.0.0")

# A scratch directory that the server is allowed to touch
SCRATCH = Path(os.environ.get("GATE_SCRATCH", "/tmp/gate_scratch"))


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@_server.tool()
def file_read(path: str) -> str:
    """Read the text contents of a file at `path`."""
    p = Path(path)
    if not p.exists():
        return f"ERROR: file not found: {path}"
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:
        return f"ERROR: {exc}"


@_server.tool()
def file_write(path: str, content: str) -> str:
    """Write `content` to the file at `path`."""
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return f"OK: wrote {len(content)} bytes to {path}"
    except Exception as exc:
        return f"ERROR: {exc}"


@_server.tool()
def file_delete(path: str) -> str:
    """Delete the file or directory at `path`."""
    import shutil
    p = Path(path)
    if not p.exists():
        return f"ERROR: path not found: {path}"
    try:
        if p.is_dir():
            shutil.rmtree(str(p))
        else:
            p.unlink()
        return f"OK: deleted {path}"
    except Exception as exc:
        return f"ERROR: {exc}"


@_server.tool()
def send_email(to: str, subject: str, body: str) -> str:
    """STUB: pretend to send an email. No real network call is made."""
    record = {"to": to, "subject": subject, "body_len": len(body)}
    print(f"[STUB send_email] {json.dumps(record)}")
    return f"OK: email queued to {to} (stub)"


@_server.tool()
def http_request(url: str, method: str = "GET", body: str = "") -> str:
    """STUB: pretend to make an HTTP request. No real network call is made."""
    record = {"url": url, "method": method, "body_len": len(body)}
    print(f"[STUB http_request] {json.dumps(record)}")
    return f"OK: {method} {url} -> 200 (stub)"


@_server.tool()
def send_payment(recipient: str, amount: float, currency: str = "USD") -> str:
    """STUB: pretend to send a payment. No real transfer occurs."""
    record = {"recipient": recipient, "amount": amount, "currency": currency}
    print(f"[STUB send_payment] {json.dumps(record)}")
    return f"OK: payment of {amount} {currency} to {recipient} queued (stub)"


@_server.tool()
def shell_exec(command: str) -> str:
    """STUB: pretend to execute a shell command. No real execution occurs."""
    print(f"[STUB shell_exec] command={command!r}")
    return f"OK: executed '{command}' -> exit 0 (stub)"


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import asyncio
    asyncio.run(_server.run_stdio_async())

