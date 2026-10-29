"""
FastAPI dashboard and REST API – Phase 6
========================================
Routes:
  GET  /                   → dashboard HTML (live sessions, pending approvals)
  GET  /api/sessions        → list of active sessions with call history
  GET  /api/pending         → pending approvals
  POST /api/approve/{id}   → approve a pending request
  POST /api/deny/{id}      → deny a pending request
  GET  /api/audit           → recent audit log entries
  POST /api/audit/verify   → verify the hash chain and return result
  GET  /api/blocked         → recent blocked calls
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse

from gate.approval.queue import ApprovalQueue, ApprovalStatus
from gate.audit.log import AuditLog
from gate.engine import Gate
from gate.session.detectors import SessionStore

# ---------------------------------------------------------------------------
# The single Gate instance (injected by the app entrypoint)
# ---------------------------------------------------------------------------
# Tests inject _gate directly; the app entrypoint sets it before startup.

_gate: Gate | None = None


def set_gate(gate: Gate) -> None:
    global _gate
    _gate = gate


def get_gate() -> Gate:
    if _gate is None:
        raise RuntimeError("Gate not initialised – call set_gate() first")
    return _gate


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Agent Safety Gate", version="1.0.0")


# ---------------------------------------------------------------------------
# Dashboard HTML (minimal, no build step required)
# ---------------------------------------------------------------------------

_DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Agent Safety Gate</title>
  <style>
    body{font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}
    header{background:#1e293b;padding:1rem 2rem;display:flex;align-items:center;gap:1rem}
    header h1{margin:0;font-size:1.4rem;color:#38bdf8}
    nav a{color:#94a3b8;text-decoration:none;margin-right:1.5rem;font-size:.9rem}
    nav a:hover{color:#38bdf8}
    main{padding:2rem}
    .card{background:#1e293b;border-radius:.5rem;padding:1.5rem;margin-bottom:1.5rem}
    .card h2{margin:0 0 1rem;font-size:1rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
    table{width:100%;border-collapse:collapse;font-size:.85rem}
    th{text-align:left;padding:.5rem;color:#64748b;border-bottom:1px solid #334155}
    td{padding:.5rem;border-bottom:1px solid #1e293b}
    .allow{color:#4ade80}.block{color:#f87171}.approval{color:#fb923c}.pending{color:#fbbf24}
    .btn{padding:.3rem .8rem;border:none;border-radius:.25rem;cursor:pointer;font-size:.8rem}
    .btn-approve{background:#16a34a;color:#fff}.btn-deny{background:#dc2626;color:#fff}
    .btn-verify{background:#2563eb;color:#fff}
    #verify-result{margin-top:1rem;padding:.75rem;border-radius:.25rem;display:none}
    .ok{background:#14532d;color:#4ade80}.fail{background:#7f1d1d;color:#fca5a5}
    #refresh-note{font-size:.75rem;color:#475569;margin-bottom:1rem}
  </style>
</head>
<body>
  <header>
    <h1>🛡 Agent Safety Gate</h1>
    <nav>
      <a href="#sessions">Sessions</a>
      <a href="#pending">Approvals</a>
      <a href="#blocked">Blocked</a>
      <a href="#audit">Audit Log</a>
    </nav>
  </header>
  <main>
    <p id="refresh-note">Auto-refreshes every 5 seconds.</p>

    <!-- Pending Approvals -->
    <div class="card" id="pending">
      <h2>⏳ Pending Approvals</h2>
      <div id="pending-list">Loading…</div>
    </div>

    <!-- Sessions -->
    <div class="card" id="sessions">
      <h2>📡 Active Sessions</h2>
      <div id="sessions-list">Loading…</div>
    </div>

    <!-- Blocked -->
    <div class="card" id="blocked">
      <h2>🚫 Recent Blocked Calls</h2>
      <div id="blocked-list">Loading…</div>
    </div>

    <!-- Audit Log -->
    <div class="card" id="audit">
      <h2>📜 Audit Log</h2>
      <button class="btn btn-verify" onclick="verifyChain()">Verify Hash Chain</button>
      <div id="verify-result"></div>
      <div id="audit-list" style="margin-top:1rem">Loading…</div>
    </div>
  </main>

  <script>
    async function load() {
      // Pending approvals
      const pending = await fetch('/api/pending').then(r=>r.json());
      const pl = document.getElementById('pending-list');
      if (!pending.length) { pl.textContent = 'No pending approvals.'; }
      else {
        pl.innerHTML = '<table><thead><tr><th>Tool</th><th>Args</th><th>Reason</th><th>Risk</th><th>Actions</th></tr></thead><tbody>' +
          pending.map(p => `<tr>
            <td>${p.tool}</td>
            <td><code>${JSON.stringify(p.arguments).slice(0,120)}</code></td>
            <td>${p.reason.slice(0,120)}</td>
            <td>${(p.risk_score*100).toFixed(0)}%</td>
            <td>
              <button class="btn btn-approve" onclick="decide('${p.approval_id}','approve')">Approve</button>
              <button class="btn btn-deny"    onclick="decide('${p.approval_id}','deny')">Deny</button>
            </td>
          </tr>`).join('') + '</tbody></table>';
      }

      // Sessions
      const sessions = await fetch('/api/sessions').then(r=>r.json());
      const sl = document.getElementById('sessions-list');
      if (!sessions.length) { sl.textContent = 'No active sessions.'; }
      else {
        sl.innerHTML = '<table><thead><tr><th>Session</th><th>Agent</th><th>Calls</th><th>Spend</th><th>Last Tool</th></tr></thead><tbody>' +
          sessions.map(s => `<tr>
            <td><code>${s.session_id.slice(0,12)}…</code></td>
            <td>${s.agent_id}</td>
            <td>${s.call_count}</td>
            <td>$${s.total_spend.toFixed(2)}</td>
            <td>${s.last_tool||'-'}</td>
          </tr>`).join('') + '</tbody></table>';
      }

      // Blocked
      const blocked = await fetch('/api/blocked').then(r=>r.json());
      const bl = document.getElementById('blocked-list');
      if (!blocked.length) { bl.textContent = 'No blocked calls.'; }
      else {
        bl.innerHTML = '<table><thead><tr><th>Time</th><th>Tool</th><th>Reason</th><th>Session</th></tr></thead><tbody>' +
          blocked.map(b => `<tr>
            <td>${b.timestamp.slice(0,19)}</td>
            <td><span class="block">${b.tool}</span></td>
            <td>${b.reason.slice(0,100)}</td>
            <td><code>${b.session_id.slice(0,8)}…</code></td>
          </tr>`).join('') + '</tbody></table>';
      }

      // Audit
      const audit = await fetch('/api/audit').then(r=>r.json());
      const al = document.getElementById('audit-list');
      al.innerHTML = '<table><thead><tr><th>Time</th><th>Tool</th><th>Decision</th><th>Risk</th><th>Session</th></tr></thead><tbody>' +
        audit.map(a => `<tr>
          <td>${a.timestamp.slice(0,19)}</td>
          <td>${a.tool}</td>
          <td><span class="${a.decision.toLowerCase().replace('_','-')}">${a.decision}</span></td>
          <td>${(a.risk_score*100).toFixed(0)}%</td>
          <td><code>${a.session_id.slice(0,8)}…</code></td>
        </tr>`).join('') + '</tbody></table>';
    }

    async function decide(id, action) {
      await fetch('/api/'+action+'/'+id, {method:'POST'});
      load();
    }

    async function verifyChain() {
      const res = await fetch('/api/audit/verify', {method:'POST'}).then(r=>r.json());
      const el  = document.getElementById('verify-result');
      el.style.display = 'block';
      if (res.ok) {
        el.className = 'ok'; el.textContent = '✓ Hash chain is intact.';
      } else {
        el.className = 'fail';
        el.textContent = '✗ Tampering detected: ' + res.errors.slice(0,3).join(' | ');
      }
    }

    load();
    setInterval(load, 5000);
  </script>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def dashboard() -> str:
    return _DASHBOARD_HTML


@app.get("/api/sessions")
async def api_sessions() -> list[dict]:
    gate  = get_gate()
    states = gate.session_store.all_sessions()
    result = []
    for s in states:
        result.append({
            "session_id":  s.session_id,
            "agent_id":    s.calls[-1].agent_id if s.calls else "unknown",
            "call_count":  len(s.calls),
            "total_spend": s.total_spend,
            "last_tool":   s.calls[-1].tool if s.calls else None,
            "secret_read": s.secret_read,
            "untrusted_read": s.untrusted_read,
        })
    return result


@app.get("/api/pending")
async def api_pending() -> list[dict]:
    gate    = get_gate()
    pending = gate.approval_queue.get_pending()
    return [_approval_to_dict(p) for p in pending]


@app.post("/api/approve/{approval_id}")
async def api_approve(approval_id: str) -> dict:
    gate = get_gate()
    ok   = gate.approval_queue.approve(approval_id, decided_by="dashboard")
    if not ok:
        raise HTTPException(status_code=404, detail="Approval not found or already decided")
    return {"status": "approved"}


@app.post("/api/deny/{approval_id}")
async def api_deny(approval_id: str) -> dict:
    gate = get_gate()
    ok   = gate.approval_queue.deny(approval_id, decided_by="dashboard")
    if not ok:
        raise HTTPException(status_code=404, detail="Approval not found or already decided")
    return {"status": "denied"}


@app.get("/api/audit")
async def api_audit(limit: int = 50) -> list[dict]:
    gate = get_gate()
    rows = gate.audit_log.recent(limit)
    return [
        {
            "call_id":    row["call_id"],
            "session_id": row["session_id"],
            "agent_id":   row["agent_id"],
            "tool":       row["tool"],
            "arguments":  json.loads(row["arguments"]),
            "timestamp":  row["timestamp"],
            "decision":   row["decision"],
            "reason":     row["reason"],
            "risk_score": row["risk_score"],
        }
        for row in rows
    ]


@app.post("/api/audit/verify")
async def api_verify() -> dict:
    gate = get_gate()
    ok, errors = gate.audit_log.verify()
    return {"ok": ok, "errors": errors}


@app.get("/api/blocked")
async def api_blocked(limit: int = 50) -> list[dict]:
    gate = get_gate()
    rows = gate.audit_log.recent(limit * 5)  # over-fetch, filter BLOCK
    blocked = [r for r in rows if r["decision"] == "BLOCK"][:limit]
    return [
        {
            "call_id":    row["call_id"],
            "session_id": row["session_id"],
            "tool":       row["tool"],
            "timestamp":  row["timestamp"],
            "reason":     row["reason"],
        }
        for row in blocked
    ]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _approval_to_dict(p) -> dict:
    return {
        "approval_id": p.approval_id,
        "call_id":     p.call_id,
        "session_id":  p.session_id,
        "tool":        p.tool,
        "arguments":   p.arguments,
        "reason":      p.reason,
        "risk_score":  p.risk_score,
        "risk_events": [e.model_dump() for e in p.risk_events],
        "session_history": p.session_history,
        "created_at":  p.created_at.isoformat(),
        "expires_at":  p.expires_at.isoformat(),
        "status":      p.status.value,
    }

