"""
Shared Pydantic models used across all gate sub-packages.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class Decision(str, Enum):
    ALLOW            = "ALLOW"
    BLOCK            = "BLOCK"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"


class RiskLevel(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Core call record
# ---------------------------------------------------------------------------

class ToolCall(BaseModel):
    """Normalised representation of every tool invocation passing through the gate."""

    call_id:    str      = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str      = Field(..., description="Identifies the agent's active session")
    agent_id:   str      = Field(..., description="Stable identifier for the agent")
    tool:       str      = Field(..., description="Name of the tool being invoked")
    arguments:  dict[str, Any] = Field(default_factory=dict)
    timestamp:  datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GateVerdict(BaseModel):
    """Decision returned by the gate for a ToolCall."""

    call_id:    str
    decision:   Decision
    reason:     str
    risk_score: float          = 0.0           # 0.0 – 1.0
    risk_level: RiskLevel      = RiskLevel.LOW
    approval_id: Optional[str] = None          # set when REQUIRE_APPROVAL


class RiskEvent(BaseModel):
    """A signal produced by a session detector."""

    detector:    str
    call_id:     str
    session_id:  str
    explanation: str
    escalate_to: Decision   # minimum decision this event demands

