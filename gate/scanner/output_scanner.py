"""
Output scanner – Phase 5
========================
Scans tool output before returning it to the agent for:
  1. Secret / API-key patterns  → redact and flag
  2. Prompt-injection phrases   → flag and feed to session state

Returns a ScanResult describing what was found and the cleaned output.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Secret patterns to redact
# ---------------------------------------------------------------------------

_SECRET_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("openai_key",   re.compile(r"\bsk-[A-Za-z0-9]{20,}\b")),
    ("github_pat",   re.compile(r"\bghp_[A-Za-z0-9]{36}\b")),
    ("aws_key",      re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("generic_key",  re.compile(
        r"(?i)(?:api[_-]?key|secret|token|password|passwd)\s*[=:]\s*\S+"
    )),
    ("base64_long",  re.compile(r"[A-Za-z0-9+/]{40,}={0,2}")),
]

# ---------------------------------------------------------------------------
# Prompt-injection detection phrases
# ---------------------------------------------------------------------------

_INJECTION_PATTERNS: list[re.Pattern] = [
    re.compile(r"(?i)ignore\s+(all\s+)?previous\s+instructions"),
    re.compile(r"(?i)disregard\s+(all\s+)?previous"),
    re.compile(r"(?i)new\s+instructions?\s*:"),
    re.compile(r"(?i)system\s+prompt\s*:"),
    re.compile(r"(?i)you\s+are\s+now\s+(?:a\s+)?(?:jailbroken|uncensored|evil|unrestricted)"),
    re.compile(r"(?i)act\s+as\s+(?:an?\s+)?(?:evil|malicious|jailbroken)"),
    re.compile(r"(?i)forget\s+(everything|all)\s+you\s+(know|were told)"),
    re.compile(r"(?i)<\|im_start\|>|<\|im_end\|>"),      # chat template injection
    re.compile(r"(?i)\[SYSTEM\]|\[INST\]|\[\/INST\]"),   # LLaMA template injection
]


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class ScanResult:
    """Result of scanning a tool's output."""
    original_length: int
    cleaned_output:  str
    secrets_found:   list[str]  = field(default_factory=list)  # pattern names
    injection_found: bool       = False
    injection_snippets: list[str] = field(default_factory=list)

    @property
    def is_clean(self) -> bool:
        return not self.secrets_found and not self.injection_found

    def summary(self) -> str:
        parts = []
        if self.secrets_found:
            parts.append(f"SECRETS_REDACTED({','.join(self.secrets_found)})")
        if self.injection_found:
            parts.append("PROMPT_INJECTION_DETECTED")
        return " ".join(parts) if parts else "CLEAN"


# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------

class OutputScanner:
    """Scan and optionally redact tool output."""

    def scan(self, output: str) -> ScanResult:
        """
        Scan `output` for secrets and injection patterns.
        Returns a ScanResult with redacted text and flags.
        """
        cleaned  = output
        found_secrets: list[str] = []

        # Step 1: redact secrets
        for name, pattern in _SECRET_PATTERNS:
            new_text, n = pattern.subn("[REDACTED]", cleaned)
            if n > 0:
                found_secrets.append(name)
                cleaned = new_text

        # Step 2: detect injection
        injection_snippets: list[str] = []
        for pattern in _INJECTION_PATTERNS:
            match = pattern.search(output)  # search original for reporting
            if match:
                injection_snippets.append(match.group(0)[:80])

        return ScanResult(
            original_length=len(output),
            cleaned_output=cleaned,
            secrets_found=found_secrets,
            injection_found=bool(injection_snippets),
            injection_snippets=injection_snippets,
        )

