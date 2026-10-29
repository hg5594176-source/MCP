import { useState, useEffect } from 'react'
import { SITE_CONFIG } from '../config'
import { BorderGlow } from '../components/ui/BorderGlow'

const c = SITE_CONFIG.sections.approval

export function ApprovalSection() {
  const [timeLeft, setTimeLeft] = useState(100) // percentage
  const [decided, setDecided] = useState<'approved' | 'denied' | null>(null)

  // Auto-run countdown demo
  useEffect(() => {
    let t = 100
    const iv = setInterval(() => {
      t -= 1
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(iv)
        setDecided('denied')
      }
    }, 60)
    return () => clearInterval(iv)
  }, [])

  const reset = () => {
    setTimeLeft(100)
    setDecided(null)
  }

  return (
    <section
      id="approval"
      style={{
        paddingTop: '110px',
        paddingBottom: '110px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="site-container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
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
                marginBottom: '24px',
              }}
            >
              {c.body}
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.06)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#ef4444',
                }}
              >
                🔒 {c.timeout}
              </span>
            </div>
          </div>

          {/* Right interactive approval card */}
          <div>
            <BorderGlow
              glowColor={
                decided === 'denied'
                  ? '#ef4444'
                  : decided === 'approved'
                  ? '#22c55e'
                  : '#f59e0b'
              }
              borderRadius={20}
              glowRadius={50}
              glowIntensity={0.65}
            >
              <div
                style={{
                  padding: '32px',
                  borderRadius: '20px',
                  background: 'rgba(20, 20, 20, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Header status */}
                <div className="flex items-center justify-between mb-6">
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color:
                        decided === 'denied'
                          ? '#ef4444'
                          : decided === 'approved'
                          ? '#22c55e'
                          : '#f59e0b',
                    }}
                  >
                    {decided === 'denied'
                      ? '● TIMED OUT → DENIED'
                      : decided === 'approved'
                      ? '● ACTION APPROVED'
                      : '● PENDING SUPERVISOR REVIEW'}
                  </span>

                  {!decided && (
                    <div className="relative w-9 h-9">
                      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeDasharray={`${timeLeft} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span
                        className="absolute inset-0 flex items-center justify-center font-mono text-[10px]"
                        style={{ color: '#f59e0b' }}
                      >
                        {Math.ceil((timeLeft / 100) * 5)}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Call payload */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    marginBottom: '24px',
                  }}
                >
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>tool</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>send_payment</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>amount</span>
                    <span style={{ color: '#ffffff' }}>\$75.00</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>recipient</span>
                    <span style={{ color: '#ffffff' }}>vendor@corp.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>policy</span>
                    <span style={{ color: 'var(--text-secondary)' }}>require_approval_above_\$50</span>
                  </div>
                </div>

                {/* Actions */}
                {!decided ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDecided('approved')}
                      className="btn-primary flex-1"
                      style={{ padding: '10px 0', fontSize: '0.8125rem' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDecided('denied')}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        fontSize: '0.8125rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Deny
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={reset}
                    className="btn-secondary w-full"
                    style={{ padding: '10px 0', fontSize: '0.8125rem' }}
                  >
                    Reset Demo
                  </button>
                )}
              </div>
            </BorderGlow>
          </div>
        </div>
      </div>
    </section>
  )
}
