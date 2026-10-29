import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** The Agent – a pulsing, glowing orb on the left */
export function Agent({ visible = true }: { visible?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 0.8) * 0.08
      ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.6 + Math.sin(t * 2) * 0.2
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 1.5) * 0.06
      glowRef.current.scale.setScalar(s)
      glowRef.current.position.y = Math.sin(t * 0.8) * 0.08
    }
  })

  if (!visible) return null

  return (
    <group position={[-3.5, 0, 0]}>
      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      {/* Core orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.38, 48, 48]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#38bdf8"
          emissiveIntensity={0.7}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.58, 0.012, 8, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
      </mesh>
      {/* Label */}
      <group position={[0, -0.75, 0]}>
        <mesh>
          <planeGeometry args={[1.0, 0.22]} />
          <meshBasicMaterial color="#071428" transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  )
}

