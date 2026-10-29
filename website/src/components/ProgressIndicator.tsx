
const SECTIONS = [
  'hero', 'problem', 'single-check', 'enter-gate', 'policy',
  'sessions', 'approval', 'sandbox', 'audit', 'demo',
  'results', 'howto', 'closing',
]

interface ProgressIndicatorProps {
  progress: number   // 0–1
  currentSection: string
}

export function ProgressIndicator({ progress, currentSection }: ProgressIndicatorProps) {
  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2">
      {SECTIONS.map((id, i) => {
        const dot = i / (SECTIONS.length - 1)
        const isActive = currentSection === id
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-label={`Go to section ${id}`}
            title={id}
            className={`block w-1.5 rounded-full transition-all duration-300 ${
              isActive
                ? 'h-5 bg-[#38bdf8]'
                : progress >= dot
                ? 'h-2 bg-[#38bdf8]/60'
                : 'h-2 bg-[#334155]'
            }`}
          />
        )
      })}
    </div>
  )
}

