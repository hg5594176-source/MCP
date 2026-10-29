import { useRef, useEffect } from 'react'
import { BorderGlow } from './ui/BorderGlow'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoSrc?: string
}

export function VideoModal({ isOpen, onClose, videoSrc = '/demo-video.mp4' }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {})
      }
    } else {
      document.body.style.overflow = 'unset'
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <BorderGlow
          glowColor="#38bdf8"
          borderRadius={24}
          glowRadius={60}
          glowIntensity={0.65}
        >
          <div
            style={{
              background: '#0e0e0e',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                  }}
                />
                <span
                  className="font-serif"
                  style={{ fontSize: '1.1rem', color: '#ffffff', letterSpacing: '-0.01em' }}
                >
                  Agent Safety Gate · Walkthrough Demo
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                  }}
                >
                  1080p 60fps
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Video container */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '16 / 9',
                background: '#000000',
              }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                loop
                playsInline
                autoPlay
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Footer Bar */}
            <div
              style={{
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Interactive architectural walkthrough: MetaBalls, PixelCards, policy engine & session detection.
              </span>
              <a
                href={videoSrc}
                download="AgentSafetyGate-Demo.mp4"
                className="btn-secondary"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Download MP4</span>
                <span style={{ fontSize: '0.875rem' }}>↓</span>
              </a>
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  )
}
