import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GateProps {
  visible?: boolean
  pulse?: boolean    // pulse when blocking
  opacity?: number
}

export function Gate({ visible = true, pulse = false, opacity = 0.25 }: GateProps) {
  const ringRef   = useRef<THREE.Mesh>(null)
  const shieldRef = useRef<THREE.Mesh>(null)
  const innerRef  = useRef<THREE.Mesh>(null)
  const timeRef   = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2
      if (pulse) {
        ;(ringRef.current.material as THREE.MeshBasicMaterial).color.setHex(
          Math.sin(t * 8) > 0 ? 0xef4444 : 0x22c55e
        )
      }
    }

    if (innerRef.current) {
      innerRef.current.rotation.z -= delta * 0.15
      const sc = 1 + Math.sin(t * 1.2) * 0.03
      innerRef.current.scale.setScalar(sc)
    }

    if (shieldRef.current) {
      ;(shieldRef.current.material as THREE.MeshStandardMaterial).opacity =
        opacity + Math.sin(t * 0.8) * 0.05
    }
  })

  if (!visible) return null

  return (
    <group position={[0, 0, 0]}>
      {/* Translucent shield disc */}
      <mesh ref={shieldRef}>
        <circleGeometry args={[1.4, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.4, 0.04, 8, 128]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Inner rotating ring */}
      <mesh ref={innerRef}>
        <torusGeometry args={[1.1, 0.018, 8, 96]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
      </mesh>

      {/* Center badge */}
      <mesh>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Tick marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 1.4
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * r, 0.01]}
          >
            <planeGeometry args={[0.04, 0.12]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}

