import { SITE_CONFIG } from '../config'
import { BorderGlow } from '../components/ui/BorderGlow'

const c = SITE_CONFIG.sections.singleCheck

export function SingleCheckSection() {
  return (
    <section
      id="single-check"
      style={{
        paddingTop: '110px',
        paddingBottom: '110px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="site-container max-w-5xl">
        {/* Eyebrow & Title */}
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
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.15,
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            {c.heading}
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {c.body}
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {c.steps.map((step, i) => (
            <div
              key={i}
              className="card-glass"
              style={{
                padding: '28px 24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  STEP 0{i + 1}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  PASS ✓
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {step.label}
              </h3>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                {step.note}
              </p>
            </div>
          ))}
        </div>

        {/* Attack Chain Alert Box */}
        <BorderGlow
          edgeSensitivity={40}
          glowColor="#ef4444"
          glowRadius={50}
          borderRadius={16}
          glowIntensity={0.6}
        >
          <div
            style={{
              padding: '24px 28px',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#ef4444',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Hidden Multi-Step Sequence
              </span>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: '#fca5a5',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                🔗 {c.chain}
              </p>
            </div>
          </div>
        </BorderGlow>
      </div>
    </section>
  )
}
