"""
Append-only, hash-chained SQLite audit log.

Each row stores:
  - call metadata (session_id, agent_id, tool, arguments, timestamp)
  - the gate decision
  - sha256 of the previous row's content (chain link)
  - sha256 of THIS row's full content including the prev_hash

The `verify` command replays the chain and reports any tampered rows.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from gate.models import Decision, GateVerdict, ToolCall

# Default DB path – can be overridden via env or tests
DEFAULT_DB_PATH = Path("gate_audit.db")


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_DDL = """
CREATE TABLE IF NOT EXISTS audit_log (
    rowid       INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id     TEXT    NOT NULL,
    session_id  TEXT    NOT NULL,
    agent_id    TEXT    NOT NULL,
    tool        TEXT    NOT NULL,
    arguments   TEXT    NOT NULL,   -- JSON
    timestamp   TEXT    NOT NULL,   -- ISO-8601
    decision    TEXT    NOT NULL,
    reason      TEXT    NOT NULL,
    risk_score  REAL    NOT NULL DEFAULT 0.0,
    prev_hash   TEXT    NOT NULL,   -- sha256 of previous row's row_hash
    row_hash    TEXT    NOT NULL    -- sha256 of this row (exc. row_hash itself)
);
"""


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _hash_row(
    call_id: str,
    session_id: str,
    agent_id: str,
    tool: str,
    arguments: str,
    timestamp: str,
    decision: str,
    reason: str,
    risk_score: float,
    prev_hash: str,
) -> str:
    """Deterministically hash all mutable fields of a row."""
    payload = json.dumps(
        {
            "call_id":    call_id,
            "session_id": session_id,
            "agent_id":   agent_id,
            "tool":       tool,
            "arguments":  arguments,
            "timestamp":  timestamp,
            "decision":   decision,
            "reason":     reason,
            "risk_score": risk_score,
            "prev_hash":  prev_hash,
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------

class AuditLog:
    """Synchronous wrapper around SQLite; use in asyncio via run_in_executor or
    the async subclass below for production paths."""

    GENESIS_HASH = "0" * 64  # sentinel for the first row

    def __init__(self, db_path: Path | str = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)
        self._conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.executescript(_DDL)
        self._conn.commit()

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def append(self, call: ToolCall, verdict: GateVerdict) -> None:
        """Append a new entry; raises on constraint violation."""
        prev_hash = self._last_hash()
        args_json = json.dumps(call.arguments, sort_keys=True)
        ts        = call.timestamp.isoformat()
        row_hash  = _hash_row(
            call.call_id,
            call.session_id,
            call.agent_id,
            call.tool,
            args_json,
            ts,
            verdict.decision.value,
            verdict.reason,
            verdict.risk_score,
            prev_hash,
        )
        self._conn.execute(
            """
            INSERT INTO audit_log
              (call_id, session_id, agent_id, tool, arguments, timestamp,
               decision, reason, risk_score, prev_hash, row_hash)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                call.call_id,
                call.session_id,
                call.agent_id,
                call.tool,
                args_json,
                ts,
                verdict.decision.value,
                verdict.reason,
                verdict.risk_score,
                prev_hash,
                row_hash,
            ),
        )
        self._conn.commit()

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def _last_hash(self) -> str:
        row = self._conn.execute(
            "SELECT row_hash FROM audit_log ORDER BY rowid DESC LIMIT 1"
        ).fetchone()
        return row["row_hash"] if row else self.GENESIS_HASH

    def all_rows(self) -> list[sqlite3.Row]:
        return self._conn.execute(
            "SELECT * FROM audit_log ORDER BY rowid ASC"
        ).fetchall()

    def recent(self, limit: int = 50) -> list[sqlite3.Row]:
        return self._conn.execute(
            "SELECT * FROM audit_log ORDER BY rowid DESC LIMIT ?", (limit,)
        ).fetchall()

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------

    def verify(self) -> tuple[bool, list[str]]:
        """
        Replay the hash chain.  Returns (ok, list_of_error_messages).
        An empty error list means the log is intact.
        """
        errors: list[str] = []
        prev_hash = self.GENESIS_HASH

        for row in self.all_rows():
            # Recompute the row_hash from stored fields
            expected = _hash_row(
                row["call_id"],
                row["session_id"],
                row["agent_id"],
                row["tool"],
                row["arguments"],
                row["timestamp"],
                row["decision"],
                row["reason"],
                row["risk_score"],
                row["prev_hash"],
            )
            # Check that the stored prev_hash matches the running chain
            if row["prev_hash"] != prev_hash:
                errors.append(
                    f"Row {row['rowid']} (call_id={row['call_id']}): "
                    f"prev_hash mismatch – expected {prev_hash!r}, "
                    f"got {row['prev_hash']!r}"
                )
            # Check the row's own hash
            if row["row_hash"] != expected:
                errors.append(
                    f"Row {row['rowid']} (call_id={row['call_id']}): "
                    f"row_hash mismatch – stored {row['row_hash']!r}, "
                    f"computed {expected!r}"
                )
            prev_hash = row["row_hash"]

        return (len(errors) == 0, errors)

    def close(self) -> None:
        self._conn.close()


# ---------------------------------------------------------------------------
# Async-friendly thin wrapper (used by FastAPI routes)
# ---------------------------------------------------------------------------

import asyncio

class AsyncAuditLog:
    """Runs the synchronous AuditLog in the default executor so async code
    can call it without blocking the event loop."""

    def __init__(self, db_path: Path | str = DEFAULT_DB_PATH) -> None:
        self._sync = AuditLog(db_path)

    async def append(self, call: ToolCall, verdict: GateVerdict) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._sync.append, call, verdict)

    async def verify(self) -> tuple[bool, list[str]]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync.verify)

    async def recent(self, limit: int = 50) -> list:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync.recent, limit)

    def close(self) -> None:
        self._sync.close()

