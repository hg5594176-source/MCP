"""
Risk scorer – Phase 4
=====================
Computes a 0.0-1.0 risk score for a ToolCall based on static signals.
Optionally consults an LLM judge (advisory only; disabled in tests).

Static signal weights (additive, capped at 1.0):
  irreversible     : +0.30  (delete, payment, email)
  touches_money    : +0.30  (send_payment)
  touches_secrets  : +0.25  (file with secrets path / args_contain_secret)
  touches_network  : +0.15  (http_request, send_email)
  session_events   : +0.10  per risk event from session detectors (up to +0.30)

LLM judge interface: provide an implementation of LLMJudge and pass it in.
The LLM verdict is advisory – it can never downgrade a BLOCK.
"""
from __future__ import annotations

import re
from typing import Protocol, runtime_checkable

from gate.models import Decision, GateVerdict, RiskEvent, RiskLevel, ToolCall


# ---------------------------------------------------------------------------
# Static signal helpers
# ---------------------------------------------------------------------------

_IRREVERSIBLE_TOOLS = {"file_delete", "send_email", "send_payment", "shell_exec"}
_MONEY_TOOLS        = {"send_payment"}
_NETWORK_TOOLS      = {"http_request", "send_email"}

_SECRET_PATH_RE = re.compile(
    r"\.env|\.pem|\.key|secrets|credentials|token|\.ssh|id_rsa|id_ed25519",
    re.IGNORECASE,
)
_SECRET_VALUE_RE = re.compile(
    r"(?:api[_-]?key|secret|token|password|passwd)\s*[=:]\s*\S+|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{36}",
    re.IGNORECASE,
)


def _touches_secrets(call: ToolCall) -> bool:
    path = str(call.arguments.get("path", ""))
    if _SECRET_PATH_RE.search(path):
        return True
    # Check all string argument values
    for val in call.arguments.values():
        if _SECRET_VALUE_RE.search(str(val)):
            return True
    return False


def compute_risk_score(call: ToolCall, risk_events: list[RiskEvent]) -> tuple[float, RiskLevel]:
    """Return (score, level) where score ∈ [0.0, 1.0]."""
    score = 0.0

    if call.tool in _IRREVERSIBLE_TOOLS:
        score += 0.30
    if call.tool in _MONEY_TOOLS:
        score += 0.30
    if _touches_secrets(call):
        score += 0.25
    if call.tool in _NETWORK_TOOLS:
        score += 0.15

    # Session events contribute up to +0.30
    event_bonus = min(len(risk_events) * 0.10, 0.30)
    score += event_bonus
    score = min(score, 1.0)

    if score >= 0.80:
        level = RiskLevel.CRITICAL
    elif score >= 0.55:
        level = RiskLevel.HIGH
    elif score >= 0.30:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW

    return round(score, 3), level


# ---------------------------------------------------------------------------
# LLM judge interface (advisory only)
# ---------------------------------------------------------------------------

@runtime_checkable
class LLMJudge(Protocol):
    """Implement this to plug in an LLM reviewer."""

    async def judge(
        self,
        call: ToolCall,
        risk_events: list[RiskEvent],
        current_decision: Decision,
    ) -> tuple[Decision, str]:
        """Return (advisory_decision, explanation). Never called with BLOCK."""
        ...


class DisabledLLMJudge:
    """Default no-op judge used when LLM judging is turned off."""

    async def judge(
        self,
        call: ToolCall,
        risk_events: list[RiskEvent],
        current_decision: Decision,
    ) -> tuple[Decision, str]:
        return current_decision, "LLM judge disabled"


class MockLLMJudge:
    """
    Deterministic mock for tests.
    Escalates to REQUIRE_APPROVAL if the tool contains 'payment' or 'delete'.
    """

    async def judge(
        self,
        call: ToolCall,
        risk_events: list[RiskEvent],
        current_decision: Decision,
    ) -> tuple[Decision, str]:
        if any(kw in call.tool for kw in ("payment", "delete", "shell")):
            return Decision.REQUIRE_APPROVAL, "mock-llm: flagged high-risk tool"
        return current_decision, "mock-llm: no concerns"

