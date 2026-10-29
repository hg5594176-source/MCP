import { Suspense, useState } from 'react'
import { Navbar }           from './components/Navbar'
import { ProgressIndicator } from './components/ProgressIndicator'
import { VideoModal }        from './components/VideoModal'
import { HeroSection }      from './sections/HeroSection'
import { ProblemSection }   from './sections/ProblemSection'
import { SingleCheckSection } from './sections/SingleCheckSection'
import { EnterGateSection } from './sections/EnterGateSection'
import { PolicySection }    from './sections/PolicySection'
import { SessionsSection }  from './sections/SessionsSection'
import { ApprovalSection }  from './sections/ApprovalSection'
import { SandboxSection }   from './sections/SandboxSection'
import { AuditSection }     from './sections/AuditSection'
import { DemoSection }      from './sections/DemoSection'
import { ResultsSection }   from './sections/ResultsSection'
import { HowToUseSection }  from './sections/HowToUseSection'
import { ClosingSection }   from './sections/ClosingSection'
import { useLenis }         from './hooks/useLenis'
import { useScrollProgress } from './hooks/useScrollProgress'

export default function App() {
  useLenis()
  const scrollProgress = useScrollProgress()
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  // Derive current section from scroll progress
  const currentSection = (() => {
    if (scrollProgress < 0.07) return 'hero'
    if (scrollProgress < 0.15) return 'problem'
    if (scrollProgress < 0.23) return 'single-check'
    if (scrollProgress < 0.31) return 'enter-gate'
    if (scrollProgress < 0.40) return 'policy'
    if (scrollProgress < 0.54) return 'sessions'
    if (scrollProgress < 0.62) return 'approval'
    if (scrollProgress < 0.70) return 'sandbox'
    if (scrollProgress < 0.78) return 'audit'
    if (scrollProgress < 0.86) return 'demo'
    if (scrollProgress < 0.91) return 'results'
    if (scrollProgress < 0.96) return 'howto'
    return 'closing'
  })()

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Skip to content */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only"
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 200,
          padding: '8px 16px', background: '#38bdf8', color: '#0b0b0b',
          borderRadius: '8px', fontWeight: 700, textDecoration: 'none',
        }}
      >
        Skip to content
      </a>

      <Navbar
        currentSection={currentSection}
        onOpenDemo={() => setIsVideoOpen(true)}
      />
      <ProgressIndicator progress={scrollProgress} currentSection={currentSection} />

      <Suspense fallback={null}>
        <main id="top">
          <HeroSection onOpenDemo={() => setIsVideoOpen(true)} />
          <ProblemSection />
          <SingleCheckSection />
          <EnterGateSection />
          <PolicySection />
          <SessionsSection />
          <ApprovalSection />
          <SandboxSection />
          <AuditSection />
          <DemoSection />
          <ResultsSection />
          <HowToUseSection />
          <ClosingSection />
        </main>
      </Suspense>

      {/* Production Video Walkthrough Modal */}
      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoSrc="/demo-video.mp4"
      />
    </div>
  )
}
