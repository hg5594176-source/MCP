import { BorderGlow } from '../components/ui/BorderGlow'
import { SITE_CONFIG } from '../config'

const c = SITE_CONFIG.sections.policy

export function PolicySection() {
  return (
    <section id="policy" className="relative min-h-screen flex items-center" style={{ padding: '0 40px' }}>
      <div className="site-container w-full grid md:grid-cols-2 gap-16 items-start" style={{ paddingTop: '6rem' }}>

        {/* Copy */}
        <div>
          <p className="section-eyebrow">{c.eyebrow}</p>
          <h2 className="text-headline" style={{ marginBottom: '1.5rem' }}>{c.heading}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            {c.body}
          </p>

          {/* Decision precedence bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p className="section-eyebrow" style={{ marginBottom: '8px' }}>Decision Precedence</p>
            {[
              { d: 'BLOCK',            color: 'var(--color-red)',   w: '100%' },
              { d: 'REQUIRE_APPROVAL', color: 'var(--color-amber)', w: '66%' },
              { d: 'ALLOW',            color: 'var(--color-green)', w: '33%' },
            ].map((row) => (
              <div key={row.d} className="flex items-center gap-3">
                <div style={{ width: '128px', textAlign: 'right', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.color }}>
                  {row.d}
                </div>
                <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: row.w, height: '100%', background: row.color, borderRadius: '2px', transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YAML snippet wrapped in BorderGlow */}
        <div>
          <BorderGlow
            backgroundColor="#111111"
            borderRadius={16}
            glowColor="197 100% 60%"
            glowRadius={32}
            colors={['#38bdf8', '#22c55e', '#ef4444']}
            fillOpacity={0.15}
          >
            <pre
              style={{
                padding: '1.5rem',
                fontSize: '0.8125rem',
                lineHeight: 1.7,
                overflowX: 'auto',
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                margin: 0,
                borderRadius: '16px',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}># policies/default.yaml{'\n'}</span>
              {c.yamlSnippet.split('\n').map((line, i) => (
                <span key={i}>
                  {line
                    .split(/(\bblock\b|\brequire_approval\b|\ballow\b|tool:|action:|match:|amount_gt:|recipient_domain_not_in:)/)
                    .map((part, j) => {
                      if (part === 'block')            return <span key={j} style={{ color: 'var(--color-red)' }}>{part}</span>
                      if (part === 'allow')            return <span key={j} style={{ color: 'var(--color-green)' }}>{part}</span>
                      if (part === 'require_approval') return <span key={j} style={{ color: 'var(--color-amber)' }}>{part}</span>
                      if (/^(tool:|action:|match:|amount_gt:|recipient_domain_not_in:)$/.test(part))
                                                       return <span key={j} style={{ color: '#38bdf8' }}>{part}</span>
                      return <span key={j}>{part}</span>
                    })}
                  {'\n'}
                </span>
              ))}
            </pre>
          </BorderGlow>
        </div>
      </div>
    </section>
  )
}
