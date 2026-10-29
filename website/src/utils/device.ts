/** Detect low-end device or mobile for lighter scene. */
export function isLowEnd(): boolean {
  if (typeof window === 'undefined') return false
  // Mobile check
  if (/Mobi|Android/i.test(navigator.userAgent)) return true
  // Hardware concurrency check (low-end = ≤ 2 cores)
  if (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2) return true
  // Memory check (Chrome only)
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return true
  return false
}

/** Check if WebGL is available. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

/** Check for reduced motion preference. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

