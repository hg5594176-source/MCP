import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SITE_CONFIG } from '../config'
import { SplitFlapText } from '../components/ui/SplitFlapText'
import { MetaBalls } from '../components/ui/MetaBalls'
import { sound } from '../services/sound'

export function HeroSection({ onOpenDemo }: { onOpenDemo?: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.2 }
      )
    }
  }, [])

  return (
    <section
      id="hero"
      style={{
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingTop: '150px',
        paddingBottom: '90px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* MetaBalls Fluid Cursor Reactive Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0.42,
          transition: 'opacity 0.4s ease',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)',
        }}
      >
        <MetaBalls
          color="#ffffff"
          cursorBallColor="#ffffff"
          variant="solid"
          motion="orbit"
          ballCount={18}
          animationSize={28}
          gooeyness={0.52}
          stretch={0.58}
          wobble={0.55}
          speed={0.28}
          cursorBallSize={3.2}
          enableTransparency={true}
          enableMouseInteraction={true}
          clickBurst={true}
          lineWidth={1.5}
          rings={4}
        />
      </div>

      <div
        ref={contentRef}
        className="site-container"
        style={{
          maxWidth: '920px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Eyebrow badge */}
        <div style={{ marginBottom: '28px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            MCP-Compatible · Open Source Security Gateway
          </span>
        </div>

        {/* Large editorial headline with SplitFlapText board */}
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(2.75rem, 5.8vw, 5.25rem)',
            lineHeight: 1.12,
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <span>
            The seatbelt <em style={{ fontStyle: 'italic' }}>for</em> AI agents
          </span>
          <div
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '100%',
              padding: '6px 0',
            }}
          >
            <SplitFlapText
              words={['ALLOW CALLS ', 'BLOCK ATTACKS', 'REQUIRE APPROV', 'SESSION SAFE ', 'ZERO BYPASS ']}
              flipDuration={0.12}
              stagger={0.05}
              cycleDelay={2600}
              charset="alphanumeric"
              flipsPerChar={8}
              order="left"
              align="center"
              tileStyle="board"
              tileColor="#12161f"
              textColor="#f8fafc"
              glare={0.3}
              depth={0.6}
              tileRadius={8}
              gap="clamp(3px, 0.8vw, 6px)"
              fontSize="clamp(20px, 4.2vw, 44px)"
              loop
              padTo={13}
              intro
              onMouseEnter={() => sound.playHover()}
            />
          </div>
        </h1>

        {/* Subtle supporting text */}
        <p
          className="font-sans"
          style={{
            fontSize: 'clamp(0.9375rem, 1.25vw, 1.125rem)',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxWidth: '580px',
            margin: '0 auto 40px',
            fontWeight: 400,
          }}
        >
          {SITE_CONFIG.sections.hero.sub}
        </p>

        {/* CTA Buttons — matching Innotech pill style */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenDemo}
            className="btn-primary"
            style={{
              padding: '14px 28px',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Watch Live Demo</span>
            <span style={{ fontSize: '0.875rem' }}>▶</span>
          </button>
          <a
            href="#enter-gate"
            className="btn-secondary"
            style={{
              padding: '14px 28px',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <span>Explore Capabilities</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
