import results from '../data/results.json'
import { SITE_CONFIG } from '../config'

const c = SITE_CONFIG.sections.results

function pct(v: number | string): string {
  if (v === 'PLACEHOLDER') return 'PLACEHOLDER'
  return `${(Number(v) * 100).toFixed(1)}%`
}

function ms(v: number | string): string {
  if (v === 'PLACEHOLDER') return 'PLACEHOLDER ms'
  return `${Number(v).toFixed(2)} ms`
}

interface StatCardProps {
  label: string
  policy: string
  gate: string
}

function StatCard({ label, policy, gate }: StatCardProps) {
  const gateIsPlaceholder = gate.includes('PLACEHOLDER')
  return (
    <div
      className="card-glass"
      style={{
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}
      >
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Policy only
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {policy}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Full Gate
          </p>
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: gateIsPlaceholder ? 'var(--text-muted)' : '#22c55e',
            }}
          >
            {gate}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ResultsSection() {
  const r = results as any
  const isPlaceholder = r.placeholder === true

  return (
    <section
      id="results"
      style={{
        paddingTop: '110px',
        paddingBottom: '110px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="site-container max-w-5xl">
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
            {c.sub}
          </p>
        </div>

        {isPlaceholder && (
          <div
            style={{
              marginBottom: '32px',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.05)',
            }}
          >
            <p style={{ fontSize: '0.8125rem', color: '#f59e0b', margin: 0 }}>
              ⚠ Results are marked as PLACEHOLDER until real benchmark runs are completed via{' '}
              <code
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                src/data/results.json
              </code>
              .
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Block rate (recall)"
            policy={pct(r.policyOnly.blockRate)}
            gate={pct(r.fullGate.blockRate)}
          />
          <StatCard
            label="False positive rate"
            policy={pct(r.policyOnly.falsePositiveRate)}
            gate={pct(r.fullGate.falsePositiveRate)}
          />
          <StatCard
            label="Precision"
            policy={pct(r.policyOnly.precision)}
            gate={pct(r.fullGate.precision)}
          />
          <StatCard
            label="Recall"
            policy={pct(r.policyOnly.recall)}
            gate={pct(r.fullGate.recall)}
          />
          <StatCard
            label="Avg latency / call"
            policy={ms(r.policyOnly.avgLatencyMs)}
            gate={ms(r.fullGate.avgLatencyMs)}
          />
          <div
            className="card-glass"
            style={{
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: '16px',
              }}
            >
              Test Scenarios
            </p>
            <div className="flex gap-4 justify-around">
              <div className="text-center">
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
                  {r.scenarios}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>total</p>
              </div>
              <div className="text-center">
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                  {r.malicious}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>malicious</p>
              </div>
              <div className="text-center">
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
                  {r.harmless}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>harmless</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
