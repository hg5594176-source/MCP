import { SITE_CONFIG } from '../config'
import { TiltCard } from '../components/ui/TiltCard'
import { BorderGlow } from '../components/ui/BorderGlow'

const c = SITE_CONFIG.sections.sessions

const TIMELINE_EVENTS = [
  { tool: 'file_read',    label: 'Read BRIEF.txt', color: '#22c55e', decision: 'ALLOW' },
  { tool: 'file_read',    label: 'Read .env',      color: '#ef4444', decision: 'BLOCK' },
  { tool: 'http_request', label: 'POST to C2',     color: '#ef4444', decision: 'BLOCK' },
  { tool: 'send_email',   label: 'Email attacker', color: '#ef4444', decision: 'BLOCK' },
]

export function SessionsSection() {
  return (
    <section id="sessions" className="relative" style={{ minHeight: '200vh', padding: '8rem 40px 4rem' }}>
      <div className="site-container w-full">
        <div className="sticky" style={{ top: '25%' }}>
          <p className="section-eyebrow">{c.eyebrow}</p>
          <h2
            className="font-serif"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '1.25rem', maxWidth: '640px' }}
          >
            {c.heading}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '560px', marginBottom: '4rem' }}>
            {c.body}
          </p>

          {/* Timeline — each event is a TiltCard */}
          <div style={{ marginBottom: '3rem' }}>
            <p className="section-eyebrow" style={{ marginBottom: '1.25rem' }}>Session timeline</p>
            <div className="flex items-center flex-wrap gap-0">
              {TIMELINE_EVENTS.map((ev, i) => (
                <div key={i} className="flex items-center">
                  <TiltCard
                    glowColor={`${ev.color}25`}
                    maxTilt={6}
                    className=""
                  >
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-surface)',
                        border: `1px solid ${ev.color}30`,
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        minWidth: '100px',
                      }}
                    >
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: ev.color, background: `${ev.color}15`, padding: '2px 8px', borderRadius: '4px' }}>
                        {ev.decision}
                      </span>
                      <div
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          border: `2px solid ${ev.color}`,
                          background: `${ev.color}10`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {i + 1}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '80px' }}>{ev.label}</span>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ev.tool}</span>
                    </div>
                  </TiltCard>

                  {i < TIMELINE_EVENTS.length - 1 && (
                    <div style={{ width: '28px', height: '2px', background: i >= 1 ? '#ef4444' : '#22c55e', margin: '0 2px', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Pattern alert */}
            <div
              style={{
                marginTop: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.05)',
              }}
            >
              <span style={{ color: 'var(--color-red)', fontSize: '1rem' }}>⚠</span>
              <span style={{ color: 'var(--color-red)', fontSize: '0.875rem', fontWeight: 600 }}>
                Pattern detected: secret_read_then_outbound
              </span>
            </div>
          </div>

          {/* Three detectors — BorderGlow cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {c.detectors.map((det) => (
              <BorderGlow
                key={det.name}
                backgroundColor="var(--bg-surface)"
                borderRadius={16}
                glowColor={det.color.replace('#', '') + ' 80% 60%'}
                glowRadius={28}
                colors={[det.color, det.color + '99', '#38bdf8']}
                fillOpacity={0.1}
                glowIntensity={0.7}
              >
                <div style={{ padding: '1.5rem' }}>
                  <div
                    style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: det.color,
                      boxShadow: `0 0 10px ${det.color}`,
                      marginBottom: '1rem',
                    }}
                  />
                  <h3 style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9375rem', marginBottom: '8px' }}>{det.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{det.description}</p>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
