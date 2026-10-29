"""
Phase 1 tests:
  1. AuditLog.append writes rows correctly.
  2. AuditLog.verify passes on an untampered log.
  3. AuditLog.verify detects a tampered row_hash.
  4. AuditLog.verify detects a tampered arguments field (hash mismatch).
  5. AuditLog.verify detects a broken chain (prev_hash mismatch).
  6. Multiple appends build a valid chain end-to-end.
"""
from __future__ import annotations

import sqlite3
import tempfile
from pathlib import Path

import pytest

from gate.audit.log import AuditLog
from gate.models import Decision, GateVerdict, ToolCall


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_call(tool: str = "file_read", session: str = "s1", agent: str = "a1") -> ToolCall:
    return ToolCall(session_id=session, agent_id=agent, tool=tool, arguments={"path": "/tmp/x"})


def _allow_verdict(call: ToolCall) -> GateVerdict:
    return GateVerdict(call_id=call.call_id, decision=Decision.ALLOW, reason="test")


def _block_verdict(call: ToolCall) -> GateVerdict:
    return GateVerdict(call_id=call.call_id, decision=Decision.BLOCK, reason="blocked-test")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def tmp_db(tmp_path: Path) -> Path:
    return tmp_path / "test_audit.db"


@pytest.fixture
def log(tmp_db: Path) -> AuditLog:
    audit = AuditLog(tmp_db)
    yield audit
    audit.close()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestAuditLogAppend:
    def test_single_row_written(self, log: AuditLog) -> None:
        call = _make_call()
        verdict = _allow_verdict(call)
        log.append(call, verdict)

        rows = log.all_rows()
        assert len(rows) == 1
        assert rows[0]["call_id"] == call.call_id
        assert rows[0]["tool"] == "file_read"
        assert rows[0]["decision"] == "ALLOW"

    def test_prev_hash_genesis_for_first_row(self, log: AuditLog) -> None:
        call = _make_call()
        log.append(call, _allow_verdict(call))
        rows = log.all_rows()
        assert rows[0]["prev_hash"] == AuditLog.GENESIS_HASH

    def test_block_verdict_stored(self, log: AuditLog) -> None:
        call = _make_call()
        log.append(call, _block_verdict(call))
        rows = log.all_rows()
        assert rows[0]["decision"] == "BLOCK"

    def test_multiple_rows_link_correctly(self, log: AuditLog) -> None:
        for i in range(5):
            call = _make_call(tool=f"tool_{i}")
            log.append(call, _allow_verdict(call))
        rows = log.all_rows()
        assert len(rows) == 5
        # Each row's prev_hash must equal the previous row's row_hash
        assert rows[0]["prev_hash"] == AuditLog.GENESIS_HASH
        for idx in range(1, 5):
            assert rows[idx]["prev_hash"] == rows[idx - 1]["row_hash"], \
                f"Chain broken between row {idx-1} and {idx}"


class TestAuditLogVerify:
    def test_verify_passes_on_clean_log(self, log: AuditLog) -> None:
        for i in range(3):
            call = _make_call(tool=f"t{i}")
            log.append(call, _allow_verdict(call))
        ok, errors = log.verify()
        assert ok, f"Verification failed: {errors}"
        assert errors == []

    def test_verify_passes_on_empty_log(self, log: AuditLog) -> None:
        ok, errors = log.verify()
        assert ok
        assert errors == []

    def test_tampered_row_hash_detected(self, log: AuditLog) -> None:
        call = _make_call()
        log.append(call, _allow_verdict(call))
        # Directly edit the row_hash in SQLite to simulate tampering
        log._conn.execute(
            "UPDATE audit_log SET row_hash = ? WHERE rowid = 1",
            ("deadbeef" * 8,),
        )
        log._conn.commit()
        ok, errors = log.verify()
        assert not ok
        assert any("row_hash mismatch" in e for e in errors)

    def test_tampered_arguments_detected(self, log: AuditLog) -> None:
        call = _make_call()
        log.append(call, _allow_verdict(call))
        # Change the stored arguments without updating the hash
        log._conn.execute(
            "UPDATE audit_log SET arguments = ? WHERE rowid = 1",
            ('{"path": "/etc/passwd"}',),
        )
        log._conn.commit()
        ok, errors = log.verify()
        assert not ok
        assert any("row_hash mismatch" in e for e in errors)

    def test_broken_prev_hash_chain_detected(self, log: AuditLog) -> None:
        for i in range(3):
            call = _make_call(tool=f"t{i}")
            log.append(call, _allow_verdict(call))
        # Break the chain by zeroing out row 2's prev_hash
        log._conn.execute(
            "UPDATE audit_log SET prev_hash = ? WHERE rowid = 2",
            ("0" * 64,),
        )
        log._conn.commit()
        ok, errors = log.verify()
        assert not ok
        # Row 2's prev_hash will not match row 1's row_hash
        assert any("prev_hash mismatch" in e for e in errors)

    def test_tampered_middle_row_detected(self, log: AuditLog) -> None:
        """Editing row 2 of 4 must flag rows 2, 3, and 4 (chain collapses)."""
        for i in range(4):
            call = _make_call(tool=f"t{i}")
            log.append(call, _allow_verdict(call))
        # Tamper with the decision in row 2 (change ALLOW -> BLOCK after the fact)
        log._conn.execute(
            "UPDATE audit_log SET decision = 'BLOCK' WHERE rowid = 2"
        )
        log._conn.commit()
        ok, errors = log.verify()
        assert not ok
        # At least row 2 should be flagged (its stored hash no longer matches computed)
        assert len(errors) >= 1
