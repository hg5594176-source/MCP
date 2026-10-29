"""
Unified Gate Engine – Phase 4
==============================
Orchestrates policy evaluation, session-level detection, risk scoring,
LLM advisory (optional), and approval queue into a single `Gate.evaluate()`
call.

Decision precedence (strict):
  BLOCK > REQUIRE_APPROVAL > ALLOW

The LLM is advisory only – it can escalate ALLOW → REQUIRE_APPROVAL but
can NEVER downgrade a BLOCK.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from gate.approval.queue import ApprovalQueue, ApprovalStatus
from gate.audit.log import AuditLog
from gate.models import Decision, GateVerdict, RiskEvent, RiskLevel, ToolCall
from gate.policy.engine import PolicyEngine
from gate.risk.scorer import DisabledLLMJudge, LLMJudge, compute_risk_score
from gate.session.detectors import SessionDetector, SessionState, SessionStore

_PRIORITY = {Decision.ALLOW: 0, Decision.REQUIRE_APPROVAL: 1, Decision.BLOCK: 2}


def _escalate(current: Decision, candidate: Decision) -> Decision:
    """Return the higher-priority decision (BLOCK always wins)."""
    return candidate if _PRIORITY[candidate] > _PRIORITY[current] else current


class Gate:
    """
    The main gate object.  Create one instance per application and reuse it.

    Usage::

        gate = Gate(policy_path="policies/default.yaml", db_path="audit.db")
        verdict = await gate.evaluate(call)
    """

    def __init__(
        self,
        policy_path: Path | str | None = None,
        db_path: Path | str = "gate_audit.db",
        llm_judge: LLMJudge | None = None,
        approval_timeout: int = 300,
    ) -> None:
        self._policy   = PolicyEngine(policy_path) if policy_path else PolicyEngine()
        self._sessions = SessionStore()
        self._detector = SessionDetector()
        self._audit    = AuditLog(db_path)
        self._approval = ApprovalQueue(timeout_seconds=approval_timeout)
        self._llm      = llm_judge or DisabledLLMJudge()

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    async def evaluate(self, call: ToolCall) -> GateVerdict:
        """
        Evaluate a ToolCall through the full gate pipeline:
          1. Policy (deterministic)
          2. Session detectors (deterministic)
          3. Risk score (deterministic)
          4. LLM advisory (optional, never downgrades BLOCK)
          5. If REQUIRE_APPROVAL → wait for human decision
          6. Write to audit log
          7. Return verdict
        """
        state = self._sessions.get_or_create(call.session_id)

        # ----------------------------------------------------------
        # Step 1: Deterministic policy
        # ----------------------------------------------------------
        policy_verdict = self._policy.evaluate(call)
        decision       = policy_verdict.decision
        reasons        = [policy_verdict.reason]

        # ----------------------------------------------------------
        # Step 2: Session detectors
        # ----------------------------------------------------------
        session_escalation, risk_events = self._detector.run(state, call)
        if session_escalation is not None:
            decision = _escalate(decision, session_escalation)
            reasons.extend(ev.explanation for ev in risk_events)

        # ----------------------------------------------------------
        # Step 3: Risk scoring (always computed)
        # ----------------------------------------------------------
        risk_score, risk_level = compute_risk_score(call, risk_events)

        # ----------------------------------------------------------
        # Step 4: LLM advisory (only if not already BLOCK)
        # ----------------------------------------------------------
        if decision != Decision.BLOCK:
            llm_decision, llm_reason = await self._llm.judge(call, risk_events, decision)
            # LLM can only escalate, never downgrade
            if llm_decision != decision:
                escalated = _escalate(decision, llm_decision)
                if escalated != decision:
                    decision = escalated
                    reasons.append(f"LLM advisory: {llm_reason}")

        # ----------------------------------------------------------
        # Step 5: Record call in session state (before approval wait)
        # ----------------------------------------------------------
        state.record(call)

        # ----------------------------------------------------------
        # Step 6: If REQUIRE_APPROVAL → block agent and wait
        # ----------------------------------------------------------
        approval_id = None
        if decision == Decision.REQUIRE_APPROVAL:
            history = [c.tool for c in state.calls[-10:]]  # last 10 tools
            status  = await self._approval.submit_and_wait(
                call=call,
                reason="; ".join(reasons),
                risk_score=risk_score,
                risk_events=risk_events,
                session_history=history,
            )
            if status == ApprovalStatus.APPROVED:
                decision = Decision.ALLOW
                reasons.append("human approved")
                approval_id = None
            else:
                # DENIED or TIMEOUT → treat as BLOCK
                decision = Decision.BLOCK
                reasons.append(f"approval {status.value.lower()}")

        # ----------------------------------------------------------
        # Step 7: Build final verdict & write audit log
        # ----------------------------------------------------------
        verdict = GateVerdict(
            call_id=call.call_id,
            decision=decision,
            reason="; ".join(reasons),
            risk_score=risk_score,
            risk_level=risk_level,
            approval_id=approval_id,
        )
        self._audit.append(call, verdict)
        return verdict

    # ------------------------------------------------------------------
    # Convenience accessors for dashboard / tests
    # ------------------------------------------------------------------

    @property
    def approval_queue(self) -> ApprovalQueue:
        return self._approval

    @property
    def session_store(self) -> SessionStore:
        return self._sessions

    @property
    def audit_log(self) -> AuditLog:
        return self._audit

    def close(self) -> None:
        self._audit.close()

