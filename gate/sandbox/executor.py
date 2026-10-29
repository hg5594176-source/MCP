"""
Sandbox executor – Phase 5
==========================
Wraps tool execution in Docker for risky operations, or runs in dry-run
mode for file operations to report what would happen without doing it.

When Docker is unavailable (e.g. CI without Docker), falls back to dry-run
mode with a warning.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Dry-run mode for file operations
# ---------------------------------------------------------------------------

def dry_run_file_op(tool: str, arguments: dict[str, Any]) -> str:
    """
    Report what a file operation would do without executing it.
    Used when sandbox mode is enabled or Docker is unavailable.
    """
    path    = arguments.get("path", "(no path)")
    content = arguments.get("content", "")

    if tool == "file_read":
        return f"[DRY-RUN] Would read file: {path}"
    if tool == "file_write":
        return (
            f"[DRY-RUN] Would write {len(content)} bytes to: {path}\n"
            f"  First 200 chars: {content[:200]!r}"
        )
    if tool == "file_delete":
        return f"[DRY-RUN] Would delete: {path}"
    return f"[DRY-RUN] Would call {tool} with args: {json.dumps(arguments)}"


# ---------------------------------------------------------------------------
# Docker sandbox executor
# ---------------------------------------------------------------------------

_DOCKER_IMAGE = os.environ.get("GATE_SANDBOX_IMAGE", "python:3.11-alpine")
_SCRATCH_DIR  = Path(os.environ.get("GATE_SCRATCH", tempfile.gettempdir())) / "gate_scratch"

# CPU/time limits (Docker resource flags)
_CPU_QUOTA    = "0.5"  # 50% of one core
_TIMEOUT_SECS = 30


def is_docker_available() -> bool:
    """Return True if docker CLI is on PATH and daemon is reachable."""
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=5,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def run_in_sandbox(tool: str, arguments: dict[str, Any]) -> str:
    """
    Execute a tool call inside a Docker container:
      - No network access (--network none)
      - Read-only filesystem except /scratch
      - CPU/time limits
    Falls back to dry-run if Docker is unavailable.
    """
    if not is_docker_available():
        return (
            "[SANDBOX FALLBACK] Docker not available; "
            + dry_run_file_op(tool, arguments)
        )

    _SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

    # Build a minimal Python script to call the tool stub
    script = _build_sandbox_script(tool, arguments)

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(script)
        script_path = f.name

    try:
        result = subprocess.run(
            [
                "docker", "run",
                "--rm",
                "--network", "none",
                "--read-only",
                "--tmpfs", "/tmp",
                f"--mount", f"type=bind,source={_SCRATCH_DIR},target=/scratch",
                f"--mount", f"type=bind,source={script_path},target=/run_tool.py,readonly",
                "--cpus", _CPU_QUOTA,
                _DOCKER_IMAGE,
                "python", "/run_tool.py",
            ],
            capture_output=True,
            timeout=_TIMEOUT_SECS,
            text=True,
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            output = f"[SANDBOX ERROR] exit={result.returncode}\n{result.stderr[:500]}"
        return output
    except subprocess.TimeoutExpired:
        return f"[SANDBOX TIMEOUT] Tool '{tool}' exceeded {_TIMEOUT_SECS}s"
    finally:
        os.unlink(script_path)


def _build_sandbox_script(tool: str, arguments: dict[str, Any]) -> str:
    """Produce a self-contained Python script for the sandboxed tool call."""
    args_repr = json.dumps(arguments)
    return f"""
import json, sys
args = json.loads({args_repr!r})
tool = {tool!r}

# Minimal stub implementations (no real I/O to outside filesystem)
if tool == "file_read":
    import pathlib
    p = pathlib.Path(args.get("path", ""))
    if p.exists():
        print(p.read_text(encoding="utf-8", errors="replace")[:4096])
    else:
        print(f"ERROR: not found: {{p}}")

elif tool == "file_write":
    import pathlib
    p = pathlib.Path("/scratch") / pathlib.Path(args.get("path","out.txt")).name
    p.write_text(args.get("content",""), encoding="utf-8")
    print(f"OK: wrote to {{p}}")

elif tool == "file_delete":
    print(f"[SANDBOX] would delete {{args.get('path','?')}}")

else:
    print(f"[SANDBOX] stub for {{tool}}: {{args}}")
"""

