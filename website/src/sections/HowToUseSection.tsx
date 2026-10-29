import { SITE_CONFIG } from '../config'

const c = SITE_CONFIG.sections.howToUse

export function HowToUseSection() {
  return (
    <section id="howto" className="relative min-h-screen flex items-center" style={{ padding: '0 40px' }}>
      <div className="site-container w-full">
        <p className="section-eyebrow">{c.eyebrow}</p>
        <h2 className="font-serif" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '3rem' }}>
          {c.heading}
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          {c.steps.map((step) => (
            <div
              key={step.number}
              className="card-glass flex flex-col gap-5"
              style={{ padding: '1.75rem' }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="font-serif"
                  style={{ fontSize: '3rem', color: 'var(--text-dim)', lineHeight: 1 }}
                >
                  {step.number}
                </span>
                <div>
                  <h3 style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9375rem', marginBottom: '6px' }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.body}</p>
                </div>
              </div>
              <pre
                style={{
                  flex: 1,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  overflowX: 'auto',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {step.code}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
