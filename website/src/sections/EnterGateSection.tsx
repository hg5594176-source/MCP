import { useRef, useEffect, useState } from 'react'
import { PixelCard } from '../components/ui/PixelCard'

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

const CAPABILITIES = [
  {
    num: '01',
    title: 'Multi-Step Session Detection',
    desc: 'Watches the entire chronological sequence of agent actions. Multi-step attacks where each individual call looks benign are instantly detected and halted.',
    colors: ['#f8fafc', '#38bdf8', '#cbd5e1'],
    glowColor: '#38bdf8',
  },
  {
    num: '02',
    title: 'Deterministic YAML Policy',
    desc: 'Rule-based deterministic engine evaluates first before any LLM advisory. Attackers cannot coax, jailbreak, or prompt-inject past mathematical policy rules.',
    colors: ['#f8fafc', '#22c55e', '#cbd5e1'],
    glowColor: '#22c55e',
  },
  {
    num: '03',
    title: 'Dynamic Human Approval',
    desc: 'High-risk calls (payments, schema drops, privilege escalations) freeze at the gate. Features live operator review and default-to-deny countdown timers.',
    colors: ['#f8fafc', '#f59e0b', '#cbd5e1'],
    glowColor: '#f59e0b',
  },
  {
    num: '04',
    title: 'Docker Sandbox Isolation',
    desc: 'Risky shell and filesystem operations execute in isolated, ephemeral containers. Protects host environment and destroys temporary state upon exit.',
    colors: ['#f8fafc', '#a855f7', '#cbd5e1'],
    glowColor: '#a855f7',
  },
  {
    num: '05',
    title: 'Secret & Prompt Scanner',
    desc: 'Inspects inputs and return streams with deep pattern matching. Redacts credentials, SSH keys, and neutralizes indirect prompt injection payloads in real time.',
    colors: ['#f8fafc', '#ef4444', '#cbd5e1'],
    glowColor: '#ef4444',
  },
  {
    num: '06',
    title: 'Tamper-Evident Audit Chain',
    desc: 'Cryptographic SHA-256 hash-chained log. Every decision is permanently sealed. Any manual modification immediately breaks chain validation.',
    colors: ['#f8fafc', '#38bdf8', '#cbd5e1'],
    glowColor: '#38bdf8',
  },
]

export function EnterGateSection() {
  const reveal = useScrollReveal(0.08)

  return (
    <section
      id="enter-gate"
      ref={reveal.ref}
      style={{
        paddingTop: '110px',
        paddingBottom: '110px',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        position: 'relative',
      }}
    >
      <div
        className="site-container"
        style={{
          opacity: reveal.isVisible ? 1 : 0,
          transform: reveal.isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}
      >
        {/* Section Header */}
        <div style={{ marginBottom: '60px', maxWidth: '640px' }}>
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
            Capabilities
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.15,
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '14px',
            }}
          >
            Built for{' '}
            <em style={{ fontStyle: 'italic' }}>every</em>{' '}
            tool call
          </h2>
          <p
            className="font-sans"
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Agent Safety Gate sits inline between autonomous agents and your backend tools.
            Every invocation passes through these six integrated defense layers.
          </p>
        </div>

        {/* 6-box PixelCard Grid (exactly matching Innotech) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((feature, idx) => (
            <PixelCard
              key={feature.num}
              colors={feature.colors}
              glowColor={feature.glowColor}
              shape="square"
              origin="center"
              gap={5}
              pixelSize={2}
              speed={35}
              revealDuration={600}
              spotlight={0.5}
              glow={0.5}
              opacity={0.35}
              fade={0.7}
              trigger="hover"
              radius={20}
              clickPulse
              intro
              introDelay={idx * 75}
              theme="dark"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: '36px 30px',
                textAlign: 'left',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '16px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {feature.num}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            </PixelCard>
          ))}
        </div>
      </div>
    </section>
  )
}
