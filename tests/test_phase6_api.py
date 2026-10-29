"""
Phase 6 tests – FastAPI dashboard routes.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from gate.api.routes import app, set_gate
from gate.engine import Gate
from gate.models import Decision, ToolCall

DEFAULT_POLICY = Path(__file__).parent.parent / "policies" / "default.yaml"


@pytest.fixture
def client(tmp_path: Path):
    gate = Gate(
        policy_path=DEFAULT_POLICY,
        db_path=tmp_path / "test.db",
        approval_timeout=1,
    )
    set_gate(gate)
    with TestClient(app) as c:
        yield c
    gate.close()


class TestDashboardRoutes:
    def test_dashboard_html_served(self, client) -> None:
        resp = client.get("/")
        assert resp.status_code == 200
        assert "Agent Safety Gate" in resp.text

    def test_sessions_empty(self, client) -> None:
        resp = client.get("/api/sessions")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_pending_empty(self, client) -> None:
        resp = client.get("/api/pending")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_audit_empty(self, client) -> None:
        resp = client.get("/api/audit")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_blocked_empty(self, client) -> None:
        resp = client.get("/api/blocked")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_verify_empty_log_ok(self, client) -> None:
        resp = client.post("/api/audit/verify")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["errors"] == []

    def test_approve_missing_id(self, client) -> None:
        resp = client.post("/api/approve/nonexistent-id")
        assert resp.status_code == 404

    def test_deny_missing_id(self, client) -> None:
        resp = client.post("/api/deny/nonexistent-id")
        assert resp.status_code == 404


class TestAuditAPIAfterCalls:
    @pytest.mark.asyncio
    async def test_audit_shows_entries(self, tmp_path: Path) -> None:
        gate = Gate(
            policy_path=DEFAULT_POLICY,
            db_path=tmp_path / "test.db",
            approval_timeout=1,
        )
        set_gate(gate)
        call = ToolCall(
            session_id="s1", agent_id="a1",
            tool="file_read", arguments={"path": "/notes.txt"}
        )
        await gate.evaluate(call)

        client = TestClient(app)
        resp = client.get("/api/audit")
        assert resp.status_code == 200
        rows = resp.json()
        assert len(rows) >= 1
        assert rows[0]["tool"] == "file_read"
        gate.close()

    @pytest.mark.asyncio
    async def test_blocked_api_filters_correctly(self, tmp_path: Path) -> None:
        gate = Gate(
            policy_path=DEFAULT_POLICY,
            db_path=tmp_path / "test.db",
            approval_timeout=1,
        )
        set_gate(gate)
        # One allowed call, one blocked call
        await gate.evaluate(ToolCall(
            session_id="s1", agent_id="a1",
            tool="file_read", arguments={"path": "/notes.txt"}
        ))
        await gate.evaluate(ToolCall(
            session_id="s1", agent_id="a1",
            tool="shell_exec", arguments={"command": "ls"}
        ))

        client = TestClient(app)
        resp = client.get("/api/blocked")
        blocked = resp.json()
        assert any(b["tool"] == "shell_exec" for b in blocked)
        assert not any(b["tool"] == "file_read" for b in blocked)
        gate.close()

    @pytest.mark.asyncio
    async def test_sessions_api_shows_state(self, tmp_path: Path) -> None:
        gate = Gate(
            policy_path=DEFAULT_POLICY,
            db_path=tmp_path / "test.db",
            approval_timeout=1,
        )
        set_gate(gate)
        await gate.evaluate(ToolCall(
            session_id="my-session", agent_id="agent-1",
            tool="file_read", arguments={"path": "/notes.txt"}
        ))
        client = TestClient(app)
        resp = client.get("/api/sessions")
        sessions = resp.json()
        assert any(s["session_id"] == "my-session" for s in sessions)
        gate.close()

