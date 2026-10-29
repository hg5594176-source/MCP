import { useState } from 'react'
import { SITE_CONFIG } from '../config'
import { BorderGlow } from '../components/ui/BorderGlow'

const c = SITE_CONFIG.sections.audit

const BLOCKS = [
  { id: 'A1B2', hash: 'a1b2c3d4…', decision: 'ALLOW', tool: 'file_read' },
  { id: 'B2C3', hash: 'b2c3d4e5…', decision: 'BLOCK', tool: 'shell_exec' },
  { id: 'C3D4', hash: 'c3d4e5f6…', decision: 'ALLOW', tool: 'file_write' },
  { id: 'D4E5', hash: 'd4e5f6a7…', decision: 'ALLOW', tool: 'send_email' },
]

export function AuditSection() {
  const [tampered, setTampered] = useState<number | null>(null)

  const blockColors = (i: number): string[] => {
    if (tampered === null) return ['#38bdf8', '#22c55e', '#818cf8']
    if (i === tampered)    return ['#ef4444', '#dc2626', '#f97316']
    if (i > tampered)      return ['#f59e0b', '#ef4444', '#dc2626']
    return ['#22c55e', '#38bdf8', '#10b981']
  }

  return (
    <section id="audit" className="relative min-h-screen flex items-center" style={{ padding: '0 40px' }}>
      <div className="site-container w-full">
        <p className="section-eyebrow">{c.eyebrow}</p>
        <h2 className="text-headline" style={{ marginBottom: '1.5rem' }}>{c.heading}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '3rem', maxWidth: '560px' }}>
          {c.body}
        </p>

        {/* Chain */}
        <div className="flex items-stretch gap-0 mb-8 overflow-x-auto pb-4">
          {BLOCKS.map((block, i) => {
            const isTampered   = tampered !== null && i === tampered
            const isDownstream = tampered !== null && i > tampered

            return (
              <div key={block.id} className="flex items-center">
                <BorderGlow
                  backgroundColor={isTampered ? '#1a0000' : isDownstream ? '#1a1000' : 'var(--bg-surface)'}
                  borderRadius={12}
                  glowColor={isTampered ? '0 100% 50%' : isDownstream ? '38 100% 50%' : '197 100% 60%'}
                  glowRadius={24}
                  colors={blockColors(i)}
                  fillOpacity={0.12}
                  glowIntensity={isTampered || isDownstream ? 1.2 : 0.6}
                >
                  <button
                    onClick={() => setTampered(i === tampered ? null : i)}
                    style={{
                      padding: '1rem',
                      minWidth: '130px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '12px',
                    }}
                  >
                    <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Block #{i + 1}
                    </p>
                    <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {block.hash}
                    </p>
                    <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {block.tool}
                    </p>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: block.decision === 'ALLOW' ? 'var(--color-green)' : 'var(--color-red)',
                    }}>
                      {block.decision}
                    </span>
                    {isTampered && (
                      <p style={{ color: 'var(--color-red)', fontSize: '0.6875rem', marginTop: '8px' }}>⚠ tampered!</p>
                    )}
                    {isDownstream && (
                      <p style={{ color: 'var(--color-amber)', fontSize: '0.6875rem', marginTop: '8px' }}>⚠ chain broken</p>
                    )}
                  </button>
                </BorderGlow>

                {i < BLOCKS.length - 1 && (
                  <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke={tampered !== null && i >= tampered ? 'var(--color-red)' : 'var(--text-dim)'}
                        strokeWidth="1.5" strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTampered(null)}
            className="btn-ghost"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            Reset chain
          </button>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {tampered !== null
              ? `Block ${tampered + 1} tampered → chain broken from block ${tampered + 1} onward`
              : 'Click any block to simulate tampering'}
          </p>
        </div>
      </div>
    </section>
  )
}
