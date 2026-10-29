import { useRef } from 'react'
import { SITE_CONFIG } from '../config'

const c = SITE_CONFIG.sections.problem

const INCIDENTS = [
  { icon: '🗑', label: 'Deleted wrong directory',  tool: 'file_delete',    color: 'var(--color-red)' },
  { icon: '🔑', label: 'Leaked credentials',       tool: 'file_read .env', color: 'var(--color-red)' },
  { icon: '💳', label: 'Unauthorized payment',      tool: 'send_payment',   color: 'var(--color-red)' },
  { icon: '🕵', label: 'Prompt injection',          tool: 'hidden in brief', color: 'var(--color-amber)' },
]

export function ProblemSection() {
  const ref = useRef<HTMLElement>(null)

  return (
    <section id="problem" ref={ref} className="relative min-h-screen flex items-center" style={{ padding: '0 40px' }}>
      <div className="site-container w-full grid md:grid-cols-2 gap-16 items-center">

        <div>
          <p className="section-eyebrow">{c.eyebrow}</p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '1.5rem' }}>
            {c.heading}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '420px' }}>{c.body}</p>
        </div>

        {/* Incident cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {INCIDENTS.map((inc) => (
            <div
              key={inc.label}
              className="card-glass flex items-center gap-4"
              style={{ padding: '1rem 1.25rem', borderColor: `${inc.color === 'var(--color-red)' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` }}
            >
              <span style={{ fontSize: '1.5rem' }}>{inc.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9375rem' }}>{inc.label}</p>
                <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '2px', color: inc.color }}>
                  via {inc.tool}
                </p>
              </div>
              <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', color: inc.color, background: inc.color === 'var(--color-red)' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', letterSpacing: '0.06em' }}>
                INCIDENT
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
