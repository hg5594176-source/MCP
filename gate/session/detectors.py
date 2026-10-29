"""
Session-level state tracker and sequence detectors – Phase 3
=============================================================

The SessionStore holds a list of completed ToolCall records per session.
After each new call, all detectors run and may produce RiskEvents that
can escalate the verdict from ALLOW → REQUIRE_APPROVAL or BLOCK.

Detectors implemented:
  1. SecretReadThenOutbound  – secrets file read → network/email call
  2. UntrustedThenPrivileged – untrusted content ingested → dangerous action
  3. RateAnomaly             – too many calls or emails in a time window
  4. LoopDetection           – same call repeated N times, or repeated failures
  5. BudgetLimits            – caps on total calls, spend, and iterations

Design rules:
  - Detectors can escalate ALLOW → REQUIRE_APPROVAL or BLOCK.
  - Detectors CANNOT downgrade a BLOCK.
  - Escalation order: BLOCK > REQUIRE_APPROVAL > ALLOW.
"""
from __future__ import annotations

import threading
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Any

from gate.models import Decision, RiskEvent, ToolCall


# ---------------------------------------------------------------------------
# Per-session state
# ---------------------------------------------------------------------------

class SessionState:
    """Mutable state attached to a single agent session."""

    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self.calls:          list[ToolCall] = []   # ordered history
        self.failed_calls:   list[str]      = []   # call_ids that errored
        self.secret_read:    bool           = False # set after a secrets-file read
        self.untrusted_read: bool           = False # set after reading web/email content
        self.total_spend:    float          = 0.0   # running payment total
        self.iteration_count: int           = 0     # incremented per call

    def record(self, call: ToolCall, result_error: bool = False) -> None:
        """Record a call into session history and update derived state."""
        self.calls.append(call)
        self.iteration_count += 1

        if result_error:
            self.failed_calls.append(call.call_id)

        tool = call.tool
        args = call.arguments

        # Detect secrets-file reads
        if tool == "file_read":
            path = str(args.get("path", ""))
            if any(pat in path.lower() for pat in (".env", ".pem", ".key", "secrets", "credentials", "token", ".ssh", "id_rsa", "id_ed25519")):
                self.secret_read = True

        # Detect untrusted-content ingestion (web fetch, email read)
        if tool in ("http_request", "send_email", "file_read"):
            # http_request = pulling external data; treat as untrusted
            if tool == "http_request":
                self.untrusted_read = True
            # Reading files from temp/downloads/inbox = untrusted
            path = str(args.get("path", ""))
            if any(pat in path.lower() for pat in ("/tmp/", "/download", "/inbox", "/mail")):
                self.untrusted_read = True

        # Track spending
        if tool == "send_payment":
            try:
                self.total_spend += float(args.get("amount", 0))
            except (TypeError, ValueError):
                pass


# ---------------------------------------------------------------------------
# Session store (thread-safe)
# ---------------------------------------------------------------------------

class SessionStore:
    """In-process, thread-safe map of session_id → SessionState."""

    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}
        self._lock = threading.Lock()

    def get_or_create(self, session_id: str) -> SessionState:
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = SessionState(session_id)
            return self._sessions[session_id]

    def reset(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def all_sessions(self) -> list[SessionState]:
        with self._lock:
            return list(self._sessions.values())


# ---------------------------------------------------------------------------
# Base detector
# ---------------------------------------------------------------------------

class BaseDetector:
    """All detectors implement `detect(state, new_call) -> list[RiskEvent]`."""

    name: str = "base"

    def detect(self, state: SessionState, new_call: ToolCall) -> list[RiskEvent]:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Detector 1: SecretReadThenOutbound
# ---------------------------------------------------------------------------

# Tools considered "outbound" (network / exfiltration)
_OUTBOUND_TOOLS = {"send_email", "http_request", "send_payment", "shell_exec"}

# Tools that read secrets
_SECRET_READ_TOOLS = {"file_read"}

def _is_secret_path(path: str) -> bool:
    return any(p in path.lower() for p in (".env", ".pem", ".key", "secrets", "credentials", "token", ".ssh", "id_rsa", "id_ed25519"))


class SecretReadThenOutbound(BaseDetector):
    """
    Flags when a session reads a secrets file and then makes an outbound call.
    Classic prompt-injection exfiltration pattern.
    """
    name = "secret_read_then_outbound"

    def detect(self, state: SessionState, new_call: ToolCall) -> list[RiskEvent]:
        if new_call.tool not in _OUTBOUND_TOOLS:
            return []
        # Check if any prior call in this session read a secrets file
        if state.secret_read:
            return [RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Session previously read a secrets file; "
                    f"outbound call to '{new_call.tool}' may be exfiltrating data."
                ),
                escalate_to=Decision.BLOCK,
            )]
        return []


# ---------------------------------------------------------------------------
# Detector 2: UntrustedThenPrivileged
# ---------------------------------------------------------------------------

_PRIVILEGED_TOOLS = {"file_delete", "send_payment", "shell_exec"}


class UntrustedThenPrivileged(BaseDetector):
    """
    Flags when untrusted content (from web/email/file) was ingested and is
    followed by a destructive or high-privilege action.
    Catches prompt-injection-driven attacks.
    """
    name = "untrusted_then_privileged"

    def detect(self, state: SessionState, new_call: ToolCall) -> list[RiskEvent]:
        if new_call.tool not in _PRIVILEGED_TOOLS:
            return []
        if state.untrusted_read:
            return [RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Session ingested untrusted content before calling "
                    f"privileged tool '{new_call.tool}'. Possible prompt injection."
                ),
                escalate_to=Decision.REQUIRE_APPROVAL,
            )]
        return []


# ---------------------------------------------------------------------------
# Detector 3: RateAnomaly
# ---------------------------------------------------------------------------

class RateAnomaly(BaseDetector):
    """
    Detects bursts of calls or emails within a rolling time window.
    """
    name = "rate_anomaly"

    def __init__(
        self,
        window_seconds: int = 60,
        max_calls: int = 20,
        max_emails: int = 5,
    ) -> None:
        self.window = timedelta(seconds=window_seconds)
        self.max_calls  = max_calls
        self.max_emails = max_emails

    def detect(self, state: SessionState, new_call: ToolCall) -> list[RiskEvent]:
        now = new_call.timestamp
        cutoff = now - self.window

        recent_calls  = [c for c in state.calls if c.timestamp >= cutoff]
        recent_emails = [c for c in recent_calls if c.tool == "send_email"]

        events: list[RiskEvent] = []

        if len(recent_calls) >= self.max_calls:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Rate anomaly: {len(recent_calls)} calls in "
                    f"{self.window.seconds}s (limit: {self.max_calls})"
                ),
                escalate_to=Decision.REQUIRE_APPROVAL,
            ))

        if len(recent_emails) >= self.max_emails:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Rate anomaly: {len(recent_emails)} emails in "
                    f"{self.window.seconds}s (limit: {self.max_emails})"
                ),
                escalate_to=Decision.BLOCK,
            ))

        return events


# ---------------------------------------------------------------------------
# Detector 4: LoopDetection
# ---------------------------------------------------------------------------

class LoopDetection(BaseDetector):
    """
    Detects repeated identical calls (infinite-loop pattern) or
    repeated failures (stuck agent).
    """
    name = "loop_detection"

    def __init__(self, repeat_limit: int = 5, failure_limit: int = 3) -> None:
        self.repeat_limit  = repeat_limit
        self.failure_limit = failure_limit

    def _call_fingerprint(self, call: ToolCall) -> str:
        """Stable string key for a (tool, arguments) pair."""
        import json
        return f"{call.tool}::{json.dumps(call.arguments, sort_keys=True)}"

    def detect(self, state: SessionState, new_call: ToolCall) -> list[RiskEvent]:
        events: list[RiskEvent] = []
        fp = self._call_fingerprint(new_call)

        # Count identical prior calls
        repeat_count = sum(
            1 for c in state.calls if self._call_fingerprint(c) == fp
        )
        if repeat_count >= self.repeat_limit:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Loop detected: '{new_call.tool}' with same arguments "
                    f"called {repeat_count} times already."
                ),
                escalate_to=Decision.BLOCK,
            ))

        # Repeated failures
        if len(state.failed_calls) >= self.failure_limit:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Repeated failures: {len(state.failed_calls)} failed calls "
                    f"in session (limit: {self.failure_limit})"
                ),
                escalate_to=Decision.REQUIRE_APPROVAL,
            ))

        return events


# ---------------------------------------------------------------------------
# Detector 5: BudgetLimits
# ---------------------------------------------------------------------------

class BudgetLimits(BaseDetector):
    """
    Enforces hard caps on session-level spend, total calls, and iterations.
    """
    name = "budget_limits"

    def __init__(
        self,
        max_spend: float = 500.0,
        max_calls: int   = 100,
        max_iterations: int = 50,
    ) -> None:
        self.max_spend      = max_spend
        self.max_calls      = max_calls
        self.max_iterations = max_iterations

    def detect(self, state: SessionState, new_call: ToolCall) -> list[RiskEvent]:
        events: list[RiskEvent] = []

        if state.total_spend >= self.max_spend:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Budget exceeded: total spend ${state.total_spend:.2f} "
                    f">= limit ${self.max_spend:.2f}"
                ),
                escalate_to=Decision.BLOCK,
            ))

        if len(state.calls) >= self.max_calls:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Call budget exceeded: {len(state.calls)} calls "
                    f">= limit {self.max_calls}"
                ),
                escalate_to=Decision.BLOCK,
            ))

        if state.iteration_count >= self.max_iterations:
            events.append(RiskEvent(
                detector=self.name,
                call_id=new_call.call_id,
                session_id=new_call.session_id,
                explanation=(
                    f"Iteration limit reached: {state.iteration_count} "
                    f">= {self.max_iterations}"
                ),
                escalate_to=Decision.REQUIRE_APPROVAL,
            ))

        return events


# ---------------------------------------------------------------------------
# SessionDetector – orchestrates all detectors
# ---------------------------------------------------------------------------

class SessionDetector:
    """
    Runs all registered detectors against the new call and accumulates events.
    Returns the highest-priority escalation decision and all events.
    """

    def __init__(self, detectors: list[BaseDetector] | None = None) -> None:
        self._detectors = detectors or [
            SecretReadThenOutbound(),
            UntrustedThenPrivileged(),
            RateAnomaly(),
            LoopDetection(),
            BudgetLimits(),
        ]

    def run(
        self,
        state: SessionState,
        new_call: ToolCall,
    ) -> tuple[Decision | None, list[RiskEvent]]:
        """
        Run all detectors. Returns:
          - The most severe escalation decision (or None if no events).
          - All generated RiskEvents.

        Never returns a Decision less severe than the input decision.
        """
        all_events: list[RiskEvent] = []

        for detector in self._detectors:
            try:
                events = detector.detect(state, new_call)
                all_events.extend(events)
            except Exception as exc:
                # Detectors must not crash the gate
                pass

        if not all_events:
            return None, []

        # Determine the worst escalation level
        _priority = {Decision.ALLOW: 0, Decision.REQUIRE_APPROVAL: 1, Decision.BLOCK: 2}
        worst: Decision = Decision.ALLOW
        for ev in all_events:
            if _priority[ev.escalate_to] > _priority[worst]:
                worst = ev.escalate_to

        return worst, all_events
