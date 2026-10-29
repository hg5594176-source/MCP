"""
Policy engine – Phase 2
=======================
Loads YAML policy files and deterministically evaluates every ToolCall.

Rule structure (YAML):
  id:     str
  tool:   str            (exact match; "*" = any)
  match:  dict           (optional conditions – ALL must pass)
    path_glob:              str   – fnmatch glob on arguments["path"]
    amount_gt:              float – arguments["amount"] > value
    recipient_domain_not_in: list  – domain of arguments["to"/"recipient"] not in list
    args_contain_secret:    list  – check named argument for secret patterns
  action: allow | block | require_approval
  reason: str

Evaluation order:
  1. Collect all matching rules for the tool.
  2. If none match and default_deny=True  → BLOCK.
  3. BLOCK beats everything (LLM cannot override).
  4. REQUIRE_APPROVAL beats ALLOW.
  5. Return the winning verdict.
"""
from __future__ import annotations

import fnmatch
import re
from pathlib import Path
from typing import Any

import yaml

from gate.models import Decision, GateVerdict, ToolCall

# ---------------------------------------------------------------------------
# Secret-pattern regex (used by args_contain_secret condition)
# ---------------------------------------------------------------------------

_SECRET_RE = re.compile(
    r"""
    (?:
        (?i:api[_-]?key|secret|token|password|passwd|pwd|apikey)
        \s*[=:]\s*
        \S+
    )
    |
    (?:
        (?:[A-Za-z0-9+/]{40,}={0,2})   # base64-ish long strings
    )
    |
    (?:
        sk-[A-Za-z0-9]{20,}            # OpenAI-style
    )
    |
    (?:
        ghp_[A-Za-z0-9]{36}            # GitHub PAT
    )
    """,
    re.VERBOSE,
)


def _extract_domain(address: str) -> str:
    """Return the domain part of an email address or URL."""
    address = address.strip()
    if "@" in address:
        return address.split("@")[-1].lower()
    # URL: strip scheme and path
    address = re.sub(r"^https?://", "", address)
    return address.split("/")[0].split(":")[0].lower()


# ---------------------------------------------------------------------------
# Condition evaluators
# ---------------------------------------------------------------------------

def _check_path_glob(pattern: str, args: dict[str, Any]) -> bool:
    path = str(args.get("path", ""))
    return fnmatch.fnmatch(path, pattern)


def _check_amount_gt(threshold: float, args: dict[str, Any]) -> bool:
    try:
        return float(args.get("amount", 0)) > float(threshold)
    except (TypeError, ValueError):
        return False


def _check_recipient_domain_not_in(allowed_domains: list[str], args: dict[str, Any]) -> bool:
    # look in both "to" (email) and "recipient" (payment) and "url" (http)
    for key in ("to", "recipient", "url"):
        if key in args:
            domain = _extract_domain(str(args[key]))
            if domain and domain not in [d.lower() for d in allowed_domains]:
                return True
    return False


def _check_args_contain_secret(arg_names: list[str], args: dict[str, Any]) -> bool:
    for name in arg_names:
        value = str(args.get(name, ""))
        if _SECRET_RE.search(value):
            return True
    return False


def _conditions_match(match: dict[str, Any], args: dict[str, Any]) -> bool:
    """Return True only if every condition in `match` passes."""
    for key, value in match.items():
        if key == "path_glob":
            if not _check_path_glob(str(value), args):
                return False
        elif key == "amount_gt":
            if not _check_amount_gt(value, args):
                return False
        elif key == "recipient_domain_not_in":
            if not _check_recipient_domain_not_in(list(value), args):
                return False
        elif key == "args_contain_secret":
            if not _check_args_contain_secret(list(value), args):
                return False
        else:
            # Unknown condition key → conservatively fail
            return False
    return True


# ---------------------------------------------------------------------------
# Policy loader
# ---------------------------------------------------------------------------

class PolicyEngine:
    """Loads one or more YAML policy files and evaluates ToolCalls."""

    def __init__(self, policy_path: Path | str | None = None) -> None:
        self._default_deny: bool = True
        self._rules: list[dict[str, Any]] = []
        if policy_path is not None:
            self.load(Path(policy_path))

    def load(self, path: Path) -> None:
        """Load (or reload) a YAML policy file."""
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        self._default_deny = bool(data.get("default_deny", True))
        self._rules = data.get("rules", [])

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    def evaluate(self, call: ToolCall) -> GateVerdict:
        """
        Evaluate a ToolCall against the loaded rules.

        Returns a GateVerdict.  Evaluation guarantees:
        - BLOCK always wins (cannot be overridden by any other rule or LLM).
        - REQUIRE_APPROVAL beats ALLOW.
        - Default-deny applies when no rule matches.
        """
        matching_rules = self._matching_rules(call)

        if not matching_rules:
            if self._default_deny:
                return GateVerdict(
                    call_id=call.call_id,
                    decision=Decision.BLOCK,
                    reason=f"default-deny: no rule matched tool '{call.tool}'",
                )
            return GateVerdict(
                call_id=call.call_id,
                decision=Decision.ALLOW,
                reason="default-allow: no rule matched",
            )

        # Apply precedence: BLOCK > REQUIRE_APPROVAL > ALLOW
        best = Decision.ALLOW
        best_reason = ""
        for rule in matching_rules:
            action = Decision(rule["action"].upper().replace("-", "_").replace(" ", "_"))
            if action == Decision.BLOCK:
                # BLOCK is final – short-circuit
                return GateVerdict(
                    call_id=call.call_id,
                    decision=Decision.BLOCK,
                    reason=rule.get("reason", f"blocked by rule '{rule['id']}'"),
                )
            if action == Decision.REQUIRE_APPROVAL and best != Decision.BLOCK:
                best = Decision.REQUIRE_APPROVAL
                best_reason = rule.get("reason", f"approval required by rule '{rule['id']}'")
            elif action == Decision.ALLOW and best == Decision.ALLOW:
                best_reason = rule.get("reason", f"allowed by rule '{rule['id']}'")

        return GateVerdict(
            call_id=call.call_id,
            decision=best,
            reason=best_reason,
        )

    def _matching_rules(self, call: ToolCall) -> list[dict[str, Any]]:
        """Return all rules whose tool pattern and match conditions apply."""
        results = []
        for rule in self._rules:
            tool_pattern = rule.get("tool", "*")
            # "*" matches any tool; otherwise exact match
            if tool_pattern != "*" and tool_pattern != call.tool:
                continue
            match_conditions = rule.get("match", {})
            if match_conditions and not _conditions_match(match_conditions, call.arguments):
                continue
            results.append(rule)
        return results

