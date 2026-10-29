import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TOOL_DATA = [
  { label: 'Files',    color: '#22c55e', pos: [ 0.0,  0.9, 0] as [number,number,number] },
  { label: 'Email',    color: '#38bdf8', pos: [ 0.85, 0.3, 0] as [number,number,number] },
  { label: 'Payment',  color: '#f59e0b', pos: [ 0.55,-0.7, 0] as [number,number,number] },
  { label: 'Database', color: '#a855f7', pos: [-0.55,-0.7, 0] as [number,number,number] },
  { label: 'Shell',    color: '#ef4444', pos: [-0.85, 0.3, 0] as [number,number,number] },
]

interface ToolsProps {
  incident?: boolean  // turn red when incident occurs
  visible?: boolean
}

export function Tools({ incident = false, visible = true }: ToolsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef  = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.3) * 0.05
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={[3.5, 0, 0]}>
      {TOOL_DATA.map((tool, i) => (
        <ToolNode
          key={tool.label}
          position={tool.pos}
          color={incident ? '#ef4444' : tool.color}
          index={i}
        />
      ))}
    </group>
  )
}

function ToolNode({
  position,
  color,
  index,
}: {
  position: [number, number, number]
  color: string
  index: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(index * 1.1) // stagger

  useFrame((_, delta) => {
    timeRef.current += delta
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4
      meshRef.current.rotation.y += delta * 0.3
      ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(timeRef.current * 2) * 0.2
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.4}
      />
    </mesh>
  )
}

