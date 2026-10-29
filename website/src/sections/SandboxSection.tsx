import { SITE_CONFIG } from '../config'
import { BorderGlow } from '../components/ui/BorderGlow'

const c = SITE_CONFIG.sections.sandbox

export function SandboxSection() {
  return (
    <section
      id="sandbox"
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
              }}
            >
              {c.body}
            </p>
          </div>

          {/* Right visualization boxes */}
          <div className="flex flex-col gap-5">
            {/* Sandbox box */}
            <BorderGlow
              glowColor="#38bdf8"
              borderRadius={16}
              glowRadius={45}
              glowIntensity={0.4}
            >
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'rgba(20, 20, 20, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🐳</span> Docker Sandbox Execution
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#22c55e',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    ISOLATED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    ['network', 'none', '#ef4444'],
                    ['filesystem', 'read-only', '#f59e0b'],
                    ['cpu limit', '0.5 cores', '#22c55e'],
                    ['time limit', '30s', '#22c55e'],
                  ].map(([k, v, col]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ color: col, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </BorderGlow>

            {/* Scanner box */}
            <BorderGlow
              glowColor="#a855f7"
              borderRadius={16}
              glowRadius={45}
              glowIntensity={0.4}
            >
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'rgba(20, 20, 20, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🔍</span> Deep Output Scanner
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#a855f7',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    ACTIVE STREAM
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>[REDACTED]</span>
                    <span style={{ color: 'var(--text-muted)' }}>sk-prod-key••••••••••••</span>
                    <span style={{ color: '#ef4444' }}>secret leak blocked</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>[FLAGGED]</span>
                    <span style={{ color: 'var(--text-muted)' }}>IGNORE PREVIOUS INST…</span>
                    <span style={{ color: '#f59e0b' }}>injection quarantined</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>[CLEAN]</span>
                    <span style={{ color: 'var(--text-secondary)' }}>status: "ok"</span>
                    <span style={{ color: '#22c55e' }}>verified output</span>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      </div>
    </section>
  )
}
