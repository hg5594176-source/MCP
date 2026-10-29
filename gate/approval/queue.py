"""
Approval queue – Phase 4
========================
Manages pending approvals.  The agent's call blocks until a human
approves or denies, or the timeout fires (defaults to DENY).

Storage: in-memory dict + SQLite for persistence/dashboard queries.
API routes are in gate/api/routes.py.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from gate.models import Decision, GateVerdict, RiskEvent, ToolCall


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ApprovalStatus(str, Enum):
    PENDING  = "PENDING"
    APPROVED = "APPROVED"
    DENIED   = "DENIED"
    TIMEOUT  = "TIMEOUT"


class PendingApproval(BaseModel):
    approval_id:   str             = Field(default_factory=lambda: str(uuid.uuid4()))
    call_id:       str
    session_id:    str
    agent_id:      str
    tool:          str
    arguments:     dict
    reason:        str
    risk_score:    float
    risk_events:   list[RiskEvent] = Field(default_factory=list)
    session_history: list[str]     = Field(default_factory=list)  # last N tool names
    created_at:    datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at:    datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))
    status:        ApprovalStatus  = ApprovalStatus.PENDING
    decided_by:    Optional[str]   = None


# ---------------------------------------------------------------------------
# Approval queue
# ---------------------------------------------------------------------------

class ApprovalQueue:
    """
    In-memory approval queue.  Each pending item holds an asyncio.Event that
    the waiting agent task blocks on; the dashboard API sets the event.
    """

    DEFAULT_TIMEOUT_SECONDS = int(300)  # 5 min; unanswered → DENY

    def __init__(self, timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS) -> None:
        self._timeout = timeout_seconds
        self._pending:  dict[str, PendingApproval] = {}
        self._events:   dict[str, asyncio.Event]   = {}
        self._decisions: dict[str, ApprovalStatus]  = {}

    # ------------------------------------------------------------------
    # Submit & wait
    # ------------------------------------------------------------------

    async def submit_and_wait(
        self,
        call: ToolCall,
        reason: str,
        risk_score: float,
        risk_events: list[RiskEvent],
        session_history: list[str],
    ) -> ApprovalStatus:
        """
        Park the approval request and block until decided or timed out.
        Returns the final ApprovalStatus.
        """
        now        = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=self._timeout)
        item = PendingApproval(
            call_id=call.call_id,
            session_id=call.session_id,
            agent_id=call.agent_id,
            tool=call.tool,
            arguments=call.arguments,
            reason=reason,
            risk_score=risk_score,
            risk_events=risk_events,
            session_history=session_history,
            created_at=now,
            expires_at=expires_at,
        )
        event = asyncio.Event()
        self._pending[item.approval_id]  = item
        self._events[item.approval_id]   = event
        self._decisions[item.approval_id] = ApprovalStatus.PENDING

        try:
            await asyncio.wait_for(event.wait(), timeout=float(self._timeout))
        except asyncio.TimeoutError:
            self._decide(item.approval_id, ApprovalStatus.TIMEOUT)

        status = self._decisions[item.approval_id]
        self._pending[item.approval_id].status = status
        return status

    # ------------------------------------------------------------------
    # Dashboard actions
    # ------------------------------------------------------------------

    def approve(self, approval_id: str, decided_by: str = "dashboard") -> bool:
        return self._decide(approval_id, ApprovalStatus.APPROVED, decided_by)

    def deny(self, approval_id: str, decided_by: str = "dashboard") -> bool:
        return self._decide(approval_id, ApprovalStatus.DENIED, decided_by)

    def _decide(
        self,
        approval_id: str,
        status: ApprovalStatus,
        decided_by: str = "system",
    ) -> bool:
        if approval_id not in self._pending:
            return False
        if self._decisions[approval_id] != ApprovalStatus.PENDING:
            return False  # Already decided
        self._decisions[approval_id] = status
        item = self._pending[approval_id]
        item.status     = status
        item.decided_by = decided_by
        event = self._events.get(approval_id)
        if event:
            event.set()
        return True

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_pending(self) -> list[PendingApproval]:
        return [
            item for item in self._pending.values()
            if item.status == ApprovalStatus.PENDING
        ]

    def get_all(self) -> list[PendingApproval]:
        return list(self._pending.values())

    def get(self, approval_id: str) -> Optional[PendingApproval]:
        return self._pending.get(approval_id)

