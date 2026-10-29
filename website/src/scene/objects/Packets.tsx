import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type PacketDecision = 'allow' | 'block' | 'approval' | 'neutral'

const DECISION_COLORS: Record<PacketDecision, string> = {
  allow:    '#22c55e',
  block:    '#ef4444',
  approval: '#f59e0b',
  neutral:  '#38bdf8',
}

interface Packet {
  id: number
  progress: number   // 0 (at agent) → 1 (at tools)
  speed: number
  decision: PacketDecision
  blocked: boolean   // stops at gate if true
  y: number
  z: number
}

interface PacketsProps {
  gateBlocks?: boolean  // if true, packets stop at gate
  count?: number
  decisionMode?: PacketDecision
}

export function Packets({ gateBlocks = false, count = 12, decisionMode = 'neutral' }: PacketsProps) {
  const timeRef    = useRef(0)
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const dummy       = useMemo(() => new THREE.Object3D(), [])

  const packets = useMemo<Packet[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id:       i,
      progress: Math.random(),
      speed:    0.008 + Math.random() * 0.012,
      decision: decisionMode,
      blocked:  false,
      y:        (Math.random() - 0.5) * 1.2,
      z:        (Math.random() - 0.5) * 0.5,
    }))
  }, [count, decisionMode])

  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3)
    packets.forEach((p, i) => {
      const c = new THREE.Color(DECISION_COLORS[p.decision])
      arr[i * 3]     = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    })
    return arr
  }, [packets, count])

  useFrame((_, delta) => {
    timeRef.current += delta
    if (!instancedRef.current) return

    packets.forEach((p, i) => {
      p.progress += p.speed
      if (p.progress > 1) {
        p.progress = 0
        p.y = (Math.random() - 0.5) * 1.2
        p.z = (Math.random() - 0.5) * 0.5
      }

      // Block at gate (progress ~0.5)
      const maxProgress = gateBlocks ? 0.52 : 1
      const cp = Math.min(p.progress, maxProgress)

      // Lerp from -3.5 (agent) to 3.5 (tools)
      const x = THREE.MathUtils.lerp(-3.5, 3.5, cp)

      dummy.position.set(x, p.y, p.z)
      dummy.scale.setScalar(0.07)
      dummy.updateMatrix()
      instancedRef.current!.setMatrixAt(i, dummy.matrix)
    })

    instancedRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.1}
      >
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </meshStandardMaterial>
    </instancedMesh>
  )
}

