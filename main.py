"""
Agent Safety Gate – application entrypoint.

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000

Or via Docker Compose:
    docker compose up

Environment variables:
    GATE_DB_PATH        Path to the SQLite audit database (default: gate_audit.db)
    GATE_POLICY_PATH    Path to the YAML policy file (default: policies/default.yaml)
    GATE_APPROVAL_TIMEOUT  Seconds before an unanswered approval defaults to DENY (default: 300)
"""
from __future__ import annotations

import os
from pathlib import Path

from gate.api.routes import app, set_gate
from gate.engine import Gate

# ------------------------------------------------------------------
# Configuration from environment (or sensible defaults)
# ------------------------------------------------------------------

_DB_PATH       = Path(os.environ.get("GATE_DB_PATH",      "gate_audit.db"))
_POLICY_PATH   = Path(os.environ.get("GATE_POLICY_PATH",  "policies/default.yaml"))
_APPROVAL_TIMEOUT = int(os.environ.get("GATE_APPROVAL_TIMEOUT", "300"))

# ------------------------------------------------------------------
# Create the singleton Gate and inject it into the FastAPI app
# ------------------------------------------------------------------

gate = Gate(
    policy_path=_POLICY_PATH,
    db_path=_DB_PATH,
    approval_timeout=_APPROVAL_TIMEOUT,
)
set_gate(gate)

# `app` is the FastAPI instance imported from gate.api.routes.
# uvicorn loads this module and serves `app` directly.

