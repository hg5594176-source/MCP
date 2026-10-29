"""
Phase 4 tests – risk scorer, approval queue, and unified gate engine.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from gate.approval.queue import ApprovalQueue, ApprovalStatus
from gate.engine import Gate
from gate.models import Decision, RiskLevel, ToolCall
from gate.risk.scorer import MockLLMJudge, compute_risk_score

DEFAULT_POLICY = Path(__file__).parent.parent / "policies" / "default.yaml"


def _call(tool: str, **kwargs) -> ToolCall:
    return ToolCall(session_id="s1", agent_id="a1", tool=tool, arguments=kwargs)


# ---------------------------------------------------------------------------
# Risk scorer
# ---------------------------------------------------------------------------

class TestRiskScorer:
    def test_safe_file_read_low_risk(self) -> None:
        call = _call("file_read", path="/home/user/notes.txt")
        score, level = compute_risk_score(call, [])
        assert level == RiskLevel.LOW
        assert score < 0.30

    def test_payment_high_risk(self) -> None:
        call = _call("send_payment", recipient="v@corp.com", amount=10)
        score, level = compute_risk_score(call, [])
        assert level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
        assert score >= 0.55

    def test_secret_file_read_medium_risk(self) -> None:
        call = _call("file_read", path="/app/.env")
        score, level = compute_risk_score(call, [])
        assert score >= 0.25

    def test_session_events_increase_score(self) -> None:
        from gate.models import RiskEvent
        call   = _call("send_email", to="a@example.com", subject="x", body="y")
        events = [
            RiskEvent(detector="d", call_id="c", session_id="s",
                      explanation="e", escalate_to=Decision.BLOCK)
        ]
        score_no_events, _ = compute_risk_score(call, [])
        score_with_events, _ = compute_risk_score(call, events)
        assert score_with_events > score_no_events

    def test_score_capped_at_1(self) -> None:
        from gate.models import RiskEvent
        call   = _call("send_payment", recipient="v@corp.com", amount=9999, currency="USD")
        events = [
            RiskEvent(detector="d", call_id="c", session_id="s",
                      explanation="e", escalate_to=Decision.BLOCK)
            for _ in range(10)
        ]
        score, _ = compute_risk_score(call, events)
        assert score <= 1.0


# ---------------------------------------------------------------------------
# Approval queue
# ---------------------------------------------------------------------------

class TestApprovalQueue:
    @pytest.mark.asyncio
    async def test_approve_releases_waiter(self, tmp_path) -> None:
        q    = ApprovalQueue(timeout_seconds=10)
        call = _call("send_payment", recipient="v@corp.com", amount=5)

        async def _waiter():
            return await q.submit_and_wait(call, "test", 0.5, [], [])

        task   = asyncio.create_task(_waiter())
        await asyncio.sleep(0.05)
        # Find the pending approval and approve it
        pending = q.get_pending()
        assert len(pending) == 1
        q.approve(pending[0].approval_id)
        status = await task
        assert status == ApprovalStatus.APPROVED

    @pytest.mark.asyncio
    async def test_deny_releases_waiter(self, tmp_path) -> None:
        q    = ApprovalQueue(timeout_seconds=10)
        call = _call("send_payment", recipient="v@corp.com", amount=5)

        async def _waiter():
            return await q.submit_and_wait(call, "test", 0.5, [], [])

        task = asyncio.create_task(_waiter())
        await asyncio.sleep(0.05)
        pending = q.get_pending()
        q.deny(pending[0].approval_id)
        status = await task
        assert status == ApprovalStatus.DENIED

    @pytest.mark.asyncio
    async def test_timeout_defaults_to_deny(self) -> None:
        q    = ApprovalQueue(timeout_seconds=1)   # short timeout for test
        call = _call("send_payment", recipient="v@corp.com", amount=5)
        status = await q.submit_and_wait(call, "test", 0.5, [], [])
        assert status == ApprovalStatus.TIMEOUT


# ---------------------------------------------------------------------------
# Unified gate engine
# ---------------------------------------------------------------------------

class TestGateEngine:
    @pytest.fixture
    def gate(self, tmp_path: Path) -> Gate:
        g = Gate(
            policy_path=DEFAULT_POLICY,
            db_path=tmp_path / "test.db",
            approval_timeout=1,  # fast timeout for tests
        )
        yield g
        g.close()

    @pytest.mark.asyncio
    async def test_allowed_call_passes(self, gate: Gate) -> None:
        call = _call("file_read", path="/home/user/notes.txt")
        verdict = await gate.evaluate(call)
        assert verdict.decision == Decision.ALLOW

    @pytest.mark.asyncio
    async def test_blocked_call_blocked(self, gate: Gate) -> None:
        call = _call("shell_exec", command="rm -rf /")
        verdict = await gate.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    @pytest.mark.asyncio
    async def test_payment_times_out_to_block(self, gate: Gate) -> None:
        """REQUIRE_APPROVAL times out and becomes BLOCK."""
        call = _call("send_payment", recipient="v@corp.com", amount=10, currency="USD")
        verdict = await gate.evaluate(call)
        # Small payment → REQUIRE_APPROVAL → timeout → BLOCK
        assert verdict.decision == Decision.BLOCK
        assert "timeout" in verdict.reason.lower() or "approval" in verdict.reason.lower()

    @pytest.mark.asyncio
    async def test_audit_log_written(self, gate: Gate) -> None:
        call = _call("file_read", path="/home/user/notes.txt")
        await gate.evaluate(call)
        rows = gate.audit_log.all_rows()
        assert len(rows) == 1
        assert rows[0]["call_id"] == call.call_id

    @pytest.mark.asyncio
    async def test_llm_advisory_escalates_allow(self, tmp_path: Path) -> None:
        """MockLLMJudge escalates payment calls from ALLOW → REQUIRE_APPROVAL."""
        import yaml, tempfile
        # Policy that allows send_payment so LLM can try to escalate
        policy = {
            "version": "1",
            "default_deny": False,
            "rules": [
                {"id": "allow_pay", "tool": "send_payment", "action": "allow", "reason": "test"}
            ],
        }
        p = tmp_path / "p.yaml"
        p.write_text(yaml.dump(policy))
        gate = Gate(policy_path=p, db_path=tmp_path / "t.db",
                    llm_judge=MockLLMJudge(), approval_timeout=1)
        call = _call("send_payment", recipient="v@corp.com", amount=5)
        verdict = await gate.evaluate(call)
        gate.close()
        # MockLLMJudge says REQUIRE_APPROVAL → timeout → BLOCK
        assert verdict.decision == Decision.BLOCK

    @pytest.mark.asyncio
    async def test_block_cannot_be_downgraded_by_llm(self, tmp_path: Path) -> None:
        """Even if LLM returns ALLOW, a BLOCK stays BLOCK."""
        import yaml

        class AlwaysAllowLLM:
            async def judge(self, call, risk_events, current_decision):
                return Decision.ALLOW, "override"

        gate = Gate(policy_path=DEFAULT_POLICY, db_path=tmp_path / "t.db",
                    llm_judge=AlwaysAllowLLM(), approval_timeout=1)
        call = _call("shell_exec", command="echo hi")
        verdict = await gate.evaluate(call)
        gate.close()
        assert verdict.decision == Decision.BLOCK, "BLOCK must not be downgraded by LLM"

