import { useState, useEffect } from 'react'

interface NavbarProps {
  currentSection: string
  onOpenDemo?: () => void
}

export function Navbar({ currentSection, onOpenDemo }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'EXPLORE', href: '#hero' },
    { label: 'Problem', href: '#problem' },
    { label: 'Capabilities', href: '#enter-gate' },
    { label: 'Sessions', href: '#sessions' },
    { label: 'Audit', href: '#audit' },
    { label: 'Live Demo', href: '#demo' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        padding: scrolled ? '12px 0' : '20px 0',
        backgroundColor: scrolled ? 'rgba(11,11,11,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
      aria-label="Main navigation"
    >
      <div className="site-container flex items-center justify-between">
        {/* Logo — serif wordmark matching Innotech brand style */}
        <a
          href="#hero"
          className="flex items-center gap-2 no-underline"
          style={{ textDecoration: 'none' }}
        >
          <span
            className="font-serif"
            style={{
              fontSize: '1.35rem',
              color: '#ffffff',
              letterSpacing: '-0.01em',
              fontWeight: 500,
            }}
          >
            SafetyGate
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              padding: '1px 4px',
              verticalAlign: 'middle',
            }}
          >
            MCP
          </span>
        </a>

        {/* Center pill nav (matching AgentDesk pill menu) */}
        <nav
          className="hidden md:flex items-center gap-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 6px',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {navLinks.map((link) => {
            const isActive = currentSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        {/* Right action group matching screenshot */}
        <div className="hidden md:flex items-center gap-3">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
              }}
            />
            AI Gateway
          </div>

          <button
            onClick={onOpenDemo}
            className="btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <span>WATCH DEMO</span>
            <span style={{ fontSize: '0.875rem' }}>▶</span>
          </button>
        </div>
      </div>
    </header>
  )
}
