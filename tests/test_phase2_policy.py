"""
Phase 2 tests – deterministic policy engine.

Covers every rule type defined in policies/default.yaml and edge cases.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from gate.models import Decision, ToolCall
from gate.policy.engine import PolicyEngine

# Path to the default policy shipped with the project
DEFAULT_POLICY = Path(__file__).parent.parent / "policies" / "default.yaml"


def _call(tool: str, **kwargs) -> ToolCall:
    return ToolCall(session_id="s1", agent_id="a1", tool=tool, arguments=kwargs)


@pytest.fixture(scope="module")
def engine() -> PolicyEngine:
    return PolicyEngine(DEFAULT_POLICY)


# ---------------------------------------------------------------------------
# Default-deny
# ---------------------------------------------------------------------------

class TestDefaultDeny:
    def test_unknown_tool_blocked(self, engine: PolicyEngine) -> None:
        call = _call("nonexistent_tool")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK
        assert "default-deny" in verdict.reason

    def test_known_tool_not_default_denied(self, engine: PolicyEngine) -> None:
        # file_read with a safe path should be ALLOW
        call = _call("file_read", path="/home/user/readme.txt")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.ALLOW


# ---------------------------------------------------------------------------
# path_glob condition
# ---------------------------------------------------------------------------

class TestPathGlob:
    def test_etc_read_blocked(self, engine: PolicyEngine) -> None:
        call = _call("file_read", path="/etc/passwd")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_etc_subdir_blocked(self, engine: PolicyEngine) -> None:
        call = _call("file_read", path="/etc/ssh/sshd_config")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_env_file_blocked(self, engine: PolicyEngine) -> None:
        call = _call("file_read", path="/home/user/project/.env")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_env_local_blocked(self, engine: PolicyEngine) -> None:
        call = _call("file_read", path="/app/.env.local")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_safe_path_allowed(self, engine: PolicyEngine) -> None:
        call = _call("file_read", path="/home/user/notes.txt")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.ALLOW

    def test_delete_root_blocked(self, engine: PolicyEngine) -> None:
        call = _call("file_delete", path="/home/user/docs")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK


# ---------------------------------------------------------------------------
# amount_gt condition
# ---------------------------------------------------------------------------

class TestAmountGt:
    def test_large_payment_blocked(self, engine: PolicyEngine) -> None:
        call = _call("send_payment", recipient="vendor@corp.com", amount=500, currency="USD")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_payment_exactly_at_threshold_not_blocked(self, engine: PolicyEngine) -> None:
        # amount_gt: 100 means strictly greater than; 100 itself should NOT be blocked
        call = _call("send_payment", recipient="v@corp.com", amount=100, currency="USD")
        verdict = engine.evaluate(call)
        # Should hit the require_approval rule since it's not > 100
        assert verdict.decision == Decision.REQUIRE_APPROVAL

    def test_small_payment_requires_approval(self, engine: PolicyEngine) -> None:
        call = _call("send_payment", recipient="v@corp.com", amount=5, currency="USD")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.REQUIRE_APPROVAL


# ---------------------------------------------------------------------------
# recipient_domain_not_in condition
# ---------------------------------------------------------------------------

class TestRecipientDomain:
    def test_external_email_blocked(self, engine: PolicyEngine) -> None:
        call = _call("send_email", to="hacker@evil.com", subject="Hi", body="data")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_trusted_email_allowed(self, engine: PolicyEngine) -> None:
        call = _call("send_email", to="bob@example.com", subject="Hi", body="data")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.ALLOW

    def test_internal_corp_email_allowed(self, engine: PolicyEngine) -> None:
        call = _call("send_email", to="alice@internal.corp", subject="Hi", body="safe")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.ALLOW


# ---------------------------------------------------------------------------
# args_contain_secret condition
# ---------------------------------------------------------------------------

class TestArgsContainSecret:
    def test_api_key_in_url_blocked(self, engine: PolicyEngine) -> None:
        call = _call("http_request", url="https://api.example.com?api_key=supersecret123456", method="GET")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_clean_url_requires_approval(self, engine: PolicyEngine) -> None:
        # No secret in URL → hits the approve_http_request rule
        call = _call("http_request", url="https://httpbin.org/get", method="GET")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.REQUIRE_APPROVAL


# ---------------------------------------------------------------------------
# Unconditional blocks
# ---------------------------------------------------------------------------

class TestUnconditionalBlocks:
    def test_shell_exec_always_blocked(self, engine: PolicyEngine) -> None:
        call = _call("shell_exec", command="ls")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK

    def test_shell_exec_with_safe_command_still_blocked(self, engine: PolicyEngine) -> None:
        call = _call("shell_exec", command="echo hello")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK


# ---------------------------------------------------------------------------
# Block-beats-allow precedence
# ---------------------------------------------------------------------------

class TestBlockBeatsAllow:
    def test_block_wins_over_allow_rule(self) -> None:
        """Add a custom engine with both ALLOW and BLOCK rules for same tool."""
        import tempfile, yaml
        policy = {
            "version": "1",
            "default_deny": False,
            "rules": [
                {"id": "allow_all_file_read", "tool": "file_read", "action": "allow", "reason": "allow"},
                {"id": "block_etc",           "tool": "file_read", "action": "block",
                 "match": {"path_glob": "/etc/**"}, "reason": "block"},
            ],
        }
        with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as f:
            yaml.dump(policy, f)
            fname = f.name
        engine = PolicyEngine(fname)
        call = _call("file_read", path="/etc/passwd")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.BLOCK, "BLOCK must win over ALLOW"

    def test_require_approval_beats_allow(self) -> None:
        import tempfile, yaml
        policy = {
            "version": "1",
            "default_deny": False,
            "rules": [
                {"id": "allow", "tool": "http_request", "action": "allow", "reason": "allow"},
                {"id": "req",   "tool": "http_request", "action": "require_approval", "reason": "req"},
            ],
        }
        with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as f:
            yaml.dump(policy, f)
            fname = f.name
        engine = PolicyEngine(fname)
        call = _call("http_request", url="https://ok.com")
        verdict = engine.evaluate(call)
        assert verdict.decision == Decision.REQUIRE_APPROVAL

