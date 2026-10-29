import { useState } from 'react'
import { SITE_CONFIG } from '../config'
import { BorderGlow } from '../components/ui/BorderGlow'

const c = SITE_CONFIG.sections.liveDemo

export function DemoSection() {
  const [step, setStep] = useState(0)

  const advance = () => {
    if (step < c.steps.length - 1) setStep(step + 1)
    else setStep(0)
  }

  return (
    <section
      id="demo"
      style={{
        paddingTop: '110px',
        paddingBottom: '110px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="site-container max-w-6xl">
        <div style={{ marginBottom: '48px', maxWidth: '640px' }}>
          <span
            className="font-sans"
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '16px',
            }}
          >
            {c.eyebrow}
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)',
              lineHeight: 1.15,
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '18px',
            }}
          >
            {c.heading}
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
            }}
          >
            {c.body}
          </p>
        </div>

        {/* Split comparison boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Without Gate */}
          <div
            className="card-glass"
            style={{
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.02)',
            }}
          >
            <div
              className="flex items-center gap-2 mb-6 pb-4"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
              <span
                style={{
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                }}
              >
                {c.without}
              </span>
            </div>

            <div className="space-y-3">
              {c.steps.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    opacity: i <= step ? 1 : 0.25,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {s.tool}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginLeft: '8px',
                        }}
                      >
                        ({s.args})
                      </span>
                    </div>
                    {i <= step && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        EXECUTED
                      </span>
                    )}
                  </div>
                  {i <= step && (
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: '#f87171',
                        marginTop: '6px',
                        marginBottom: 0,
                      }}
                    >
                      {s.withoutResult}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* With Gate */}
          <BorderGlow
            glowColor="#22c55e"
            borderRadius={20}
            glowRadius={50}
            glowIntensity={0.35}
          >
            <div
              style={{
                padding: '28px',
                borderRadius: '20px',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                background: 'rgba(34, 197, 94, 0.02)',
              }}
            >
              <div
                className="flex items-center gap-2 mb-6 pb-4"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                  }}
                />
                <span
                  style={{
                    color: '#22c55e',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {c.with}
                </span>
              </div>

              <div className="space-y-3">
                {c.steps.map((s, i) => {
                  const isBlocked = s.decision === 'block'
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border:
                          i <= step
                            ? isBlocked
                              ? '1px solid rgba(239, 68, 68, 0.35)'
                              : '1px solid rgba(34, 197, 94, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                        background:
                          i <= step
                            ? isBlocked
                              ? 'rgba(239, 68, 68, 0.05)'
                              : 'rgba(34, 197, 94, 0.05)'
                            : 'rgba(0, 0, 0, 0.35)',
                        opacity: i <= step ? 1 : 0.25,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {s.tool}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              marginLeft: '8px',
                            }}
                          >
                            ({s.args})
                          </span>
                        </div>
                        {i <= step && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: isBlocked ? '#ef4444' : '#22c55e',
                              background: isBlocked
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(34, 197, 94, 0.12)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {s.decision}
                          </span>
                        )}
                      </div>
                      {i <= step && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: isBlocked ? '#f87171' : '#4ade80',
                            marginTop: '6px',
                            marginBottom: 0,
                          }}
                        >
                          {s.withResult}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* Stepper control button */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            Step {step + 1} of {c.steps.length}
          </span>
          <button
            onClick={advance}
            className="btn-primary"
            style={{
              padding: '10px 24px',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
            }}
          >
            {step < c.steps.length - 1 ? 'Next Attack Step →' : 'Replay Sequence ↺'}
          </button>
        </div>
      </div>
    </section>
  )
}
