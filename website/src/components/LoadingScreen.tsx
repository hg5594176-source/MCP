interface LoadingScreenProps {
  progress: number   // 0–100
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Shield SVG */}
      <svg
        width="64" height="64" viewBox="0 0 72 72" fill="none"
        style={{ filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' }}
      >
        <path
          d="M36 4L10 16v20c0 15.5 11 30 26 34 15-4 26-18.5 26-34V16L36 4z"
          stroke="#38bdf8" strokeWidth="2" fill="rgba(56,189,248,0.08)"
        />
        <path
          d="M26 36l7 7 14-14"
          stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>

      {/* Title */}
      <h1
        className="font-serif"
        style={{ fontSize: '1.5rem', color: '#ffffff', letterSpacing: '-0.01em' }}
      >
        Agent Safety Gate
      </h1>

      {/* Progress bar */}
      <div style={{ width: '160px', height: '1px', background: 'rgba(255,255,255,0.08)', borderRadius: '1px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            borderRadius: '1px',
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Initialising scene
      </p>
    </div>
  )
}
