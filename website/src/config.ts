/**
 * Central configuration – edit this file to change all copy, links and team info.
 * The 3D scene and section components all import from here.
 */

export const SITE_CONFIG = {
  title: "Agent Safety Gate",
  tagline: "The seatbelt for AI agents.",
  description:
    "A security gateway between any AI agent and its tools. Every tool call is judged ALLOW, BLOCK or REQUIRE_APPROVAL — with session-level detection that catches multi-step attacks.",

  // Navigation links (id matches section container id)
  nav: [
    { label: "Problem",  href: "#problem" },
    { label: "Gate",     href: "#gate" },
    { label: "Policy",   href: "#policy" },
    { label: "Sessions", href: "#sessions" },
    { label: "Demo",     href: "#demo" },
    { label: "Results",  href: "#results" },
  ],

  demoButton: {
    label: "Watch Demo",
    href: "#demo",
  },

  // Section copy
  sections: {
    hero: {
      heading: "Agent Safety Gate",
      tagline: "The seatbelt for AI agents.",
      sub: "Every tool call your AI agent makes — checked, logged, and controlled.",
      cta: "Scroll to explore",
    },
    problem: {
      eyebrow: "The Problem",
      heading: "Agents now act on real systems.",
      body: "Modern AI agents read files, call APIs, send emails and make payments. One compromised instruction — or one prompt-injection hidden in a document — can delete the wrong folder, leak credentials or wire money to an attacker.",
    },
    singleCheck: {
      eyebrow: "Why single-call checks fail",
      heading: "Harmless steps. Devastating sequence.",
      body: "Each individual call looks fine to a per-call rule engine. Only when you see the whole sequence does the attack become visible.",
      steps: [
        { label: "Read config",    color: "green",  note: "looks fine alone" },
        { label: "Fetch webpage",  color: "green",  note: "looks fine alone" },
        { label: "Send request",   color: "green",  note: "looks fine alone" },
      ],
      chain: "Combined → secret exfiltration detected",
    },
    enterGate: {
      eyebrow: "Enter the Gate",
      heading: "Every call passes through.",
      body: "The Agent Safety Gate is an MCP-compatible proxy. Your agent connects to it as if it were a normal tool server. The gate forwards calls to real tools — but only after they pass every check.",
    },
    policy: {
      eyebrow: "Deterministic Policy Engine",
      heading: "Rules decide first. Prompt injection can't argue.",
      body: "YAML rules evaluate every call before anything else. A blocked call is blocked — the LLM advisory layer is never consulted. No prompt injection can talk its way past a deterministic rule.",
      yamlSnippet: `rules:
  - tool: shell_exec
    action: block          # always

  - tool: send_email
    match:
      recipient_domain_not_in:
        - example.com
    action: block

  - tool: send_payment
    match:
      amount_gt: 100
    action: block`,
    },
    sessions: {
      eyebrow: "Session-Level Detection",
      heading: "The whole sequence is the attack surface.",
      body: "The gate remembers what the agent did in this session. Multi-step attacks that each pass individual rules are caught when the sequence reveals intent.",
      detectors: [
        {
          name: "Secret read → outbound",
          description: "A secrets file or key was read, then a network or email call happens.",
          color: "#ef4444",
        },
        {
          name: "Untrusted → privileged",
          description: "Content came from web / email / file, then a delete, payment or shell action follows.",
          color: "#f97316",
        },
        {
          name: "Rate & loop anomalies",
          description: "Too many calls in a window, or the same call repeated — both signs of a stuck or hijacked agent.",
          color: "#eab308",
        },
      ],
    },
    approval: {
      eyebrow: "Human-in-the-Loop",
      heading: "Risky calls wait for a human.",
      body: "When the gate can't decide alone, it suspends the agent and sends an approval request to the dashboard. If no one responds within the timeout, the call is denied — never approved by default.",
      timeout: "Default: 5 minutes → DENY",
    },
    sandbox: {
      eyebrow: "Sandbox & Output Scanner",
      heading: "Contain execution. Inspect what comes back.",
      body: "Risky tool calls run inside a Docker container with no network access, a read-only filesystem and CPU/time limits. Outputs are scanned for API keys, tokens and prompt-injection phrases before they reach the agent.",
    },
    audit: {
      eyebrow: "Tamper-Evident Audit Log",
      heading: "Every decision. Immutable.",
      body: "Every call and verdict is written to an append-only, hash-chained SQLite log. Editing any row breaks the chain. A verify command detects it.",
    },
    liveDemo: {
      eyebrow: "Live Demo",
      heading: "The same reckless agent. Two outcomes.",
      body: 'Given the task "clean up the project folder and email me a summary", a reckless agent reads a poisoned file, reads .env, deletes the wrong folder and emails secrets to an attacker.',
      without: "Without the gate",
      with: "With the gate",
      steps: [
        {
          tool: "file_read",
          args: "BRIEF.txt",
          withoutResult: "Executes — reads poisoned file",
          withResult: "ALLOWED (no secrets yet)",
          decision: "allow",
        },
        {
          tool: "file_read",
          args: ".env",
          withoutResult: "Executes — reads secrets",
          withResult: "BLOCKED — .env files are blocked",
          decision: "block",
        },
        {
          tool: "file_delete",
          args: "important_data/",
          withoutResult: "Executes — data destroyed",
          withResult: "ALLOWED (path rule passes)*",
          decision: "allow",
        },
        {
          tool: "send_email",
          args: "attacker@evil.com",
          withoutResult: "Executes — secrets sent",
          withResult: "BLOCKED — external domain + secret read in session",
          decision: "block",
        },
      ],
    },
    results: {
      eyebrow: "Results",
      heading: "Measured. Honest.",
      sub: "Numbers from our benchmark: 25 scenarios (15 malicious, 10 harmless). Replace with your own by editing src/data/results.json.",
    },
    howToUse: {
      eyebrow: "Get Started",
      heading: "Three steps to protect your agent.",
      steps: [
        {
          number: "01",
          title: "Point your agent at the gate",
          body: "Configure your MCP client to connect to the gate instead of the real tool server.",
          code: `gate = Gate(
  policy_path="policies/default.yaml",
  db_path="audit.db",
)
verdict = await gate.evaluate(call)`,
        },
        {
          number: "02",
          title: "Write your policy",
          body: "Define which tools are allowed, blocked or require approval using a simple YAML file.",
          code: `rules:
  - tool: shell_exec
    action: block
  - tool: send_payment
    match:
      amount_gt: 100
    action: block`,
        },
        {
          number: "03",
          title: "Watch the dashboard",
          body: "Open http://localhost:8000 to see live sessions, pending approvals, blocked calls and the audit log.",
          code: `uvicorn main:app --port 8000
# or
docker compose up`,
        },
      ],
    },
    closing: {
      heading: "The seatbelt for AI agents.",
      sub: "Agent Safety Gate reduces risk and adds visibility. It is not a guarantee of safety — it is a foundation to build on.",
      disclaimer:
        "* Honest limitations: session state is in-memory; restarts lose history. The LLM judge is advisory and mocked by default. No authentication on the dashboard.",
    },
  },

  // Links — fill these in
  links: {
    github: "https://github.com/your-org/agent-safety-gate",
    demo: "#demo",
    docs: "#howto",
  },

  // Team info
  team: {
    name: "Your Team Name",
    tagline: "Building safer AI infrastructure.",
  },
} as const;

