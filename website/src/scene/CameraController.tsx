import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Camera waypoints per scroll progress (0–1)
const WAYPOINTS = [
  // progress, position, target (lookAt)
  { p: 0.00, pos: [0, 0,  9], tgt: [0, 0, 0] },   // Hero – wide shot
  { p: 0.08, pos: [0, 0, 10], tgt: [0, 0, 0] },   // Problem – zoom out
  { p: 0.16, pos: [5, 1,  7], tgt: [0, 0, 0] },   // Single-check – side
  { p: 0.24, pos: [0, 0,  3], tgt: [0, 0,-2] },   // Enter gate – push through
  { p: 0.32, pos: [0, 0.5, 5], tgt: [0, 0, 0] },  // Policy – close on gate
  { p: 0.40, pos: [-2, 1,  7], tgt: [0, 0, 0] },  // Session timeline pull-back
  { p: 0.52, pos: [0, 0,  6], tgt: [0, 0, 0] },   // Approval – neutral
  { p: 0.60, pos: [2, 0,  5], tgt: [0, 0, 0] },   // Sandbox
  { p: 0.68, pos: [0, 0,  7], tgt: [0, 0, 0] },   // Audit chain
  { p: 0.76, pos: [0, 0,  8], tgt: [0, 0, 0] },   // Live demo
  { p: 0.84, pos: [0, 0,  9], tgt: [0, 0, 0] },   // Results
  { p: 0.92, pos: [0, 0,  8], tgt: [0, 0, 0] },   // How to use
  { p: 1.00, pos: [0, 1, 12], tgt: [0, 0, 0] },   // Closing – full pullback
]

function lerp3(
  a: [number,number,number],
  b: [number,number,number],
  t: number,
): [number,number,number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

function getCameraState(progress: number): {
  pos: [number,number,number]
  tgt: [number,number,number]
} {
  // find the bracketing waypoints
  let lo = WAYPOINTS[0]
  let hi = WAYPOINTS[WAYPOINTS.length - 1]
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (progress >= WAYPOINTS[i].p && progress <= WAYPOINTS[i + 1].p) {
      lo = WAYPOINTS[i]
      hi = WAYPOINTS[i + 1]
      break
    }
  }
  const span = hi.p - lo.p
  const t = span === 0 ? 0 : (progress - lo.p) / span
  return {
    pos: lerp3(lo.pos as [number,number,number], hi.pos as [number,number,number], t),
    tgt: lerp3(lo.tgt as [number,number,number], hi.tgt as [number,number,number], t),
  }
}

interface CameraControllerProps {
  scrollProgress: number
  mouseX: number
  mouseY: number
}

export function CameraController({ scrollProgress, mouseX, mouseY }: CameraControllerProps) {
  const { camera } = useThree()
  const currentPos  = useRef(new THREE.Vector3(0, 0, 9))
  const currentTgt  = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    const { pos, tgt } = getCameraState(scrollProgress)
    const target = new THREE.Vector3(...tgt)
    const desired = new THREE.Vector3(
      pos[0] + mouseX * 0.4,
      pos[1] + mouseY * 0.2,
      pos[2],
    )
    // Smooth damping
    currentPos.current.lerp(desired, 0.04)
    currentTgt.current.lerp(target, 0.04)

    camera.position.copy(currentPos.current)
    camera.lookAt(currentTgt.current)
  })

  return null
}

