import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

/** Initialise Lenis smooth scroll. Returns the Lenis instance ref. */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    let raf: number
    function update(time: number) {
      lenis.raf(time)
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return lenisRef
}

