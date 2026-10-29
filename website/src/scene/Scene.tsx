import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Agent } from './objects/Agent'
import { Gate } from './objects/Gate'
import { Tools } from './objects/Tools'
import { Packets } from './objects/Packets'
import { ParticleField } from './objects/ParticleField'
import { CameraController } from './CameraController'
import * as THREE from 'three'

export type SceneMode =
  | 'hero'
  | 'problem'
  | 'single-check'
  | 'enter-gate'
  | 'policy'
  | 'sessions'
  | 'approval'
  | 'sandbox'
  | 'audit'
  | 'demo'
  | 'results'
  | 'howto'
  | 'closing'

interface SceneProps {
  scrollProgress: number
  mouseX: number
  mouseY: number
  mode: SceneMode
  lowEnd?: boolean
}

function sceneFromMode(mode: SceneMode) {
  return {
    gateVisible:    !['problem', 'single-check'].includes(mode),
    agentVisible:   true,
    toolsIncident:  mode === 'problem',
    gateBlocks:     ['enter-gate', 'policy', 'sessions', 'approval', 'sandbox', 'audit', 'results', 'howto', 'closing'].includes(mode),
    gatePulse:      mode === 'approval',
    gateOpacity:    mode === 'enter-gate' ? 0.5 : 0.22,
    particleCount:  ['sessions', 'policy'].includes(mode) ? 600 : 350,
    packetCount:    mode === 'problem' ? 16 : 10,
    packetDecision: (() => {
      if (mode === 'problem')     return 'neutral' as const
      if (mode === 'policy')      return 'block'   as const
      if (mode === 'approval')    return 'approval' as const
      if (mode === 'enter-gate')  return 'block'   as const
      return 'allow' as const
    })(),
  }
}

export function Scene({ scrollProgress, mouseX, mouseY, mode, lowEnd = false }: SceneProps) {
  const cfg = sceneFromMode(mode)

  return (
    <Canvas
      className="fixed! inset-0 w-full h-full"
      camera={{ position: [0, 0, 9], fov: 60, near: 0.1, far: 100 }}
      dpr={[1, lowEnd ? 1 : 2]}
      gl={{
        antialias: !lowEnd,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      {/* Lights */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 5]}  color="#38bdf8" intensity={2}   />
      <pointLight position={[-4, 2, 3]} color="#0ea5e9" intensity={1.5} />
      <pointLight position={[4, -2, 3]} color="#22c55e" intensity={1.0} />

      {/* Camera */}
      <CameraController
        scrollProgress={scrollProgress}
        mouseX={mouseX}
        mouseY={mouseY}
      />

      {/* Objects */}
      <ParticleField count={lowEnd ? 150 : cfg.particleCount} />
      <Agent visible={cfg.agentVisible} />
      <Gate  visible={cfg.gateVisible} pulse={cfg.gatePulse} opacity={cfg.gateOpacity} />
      <Tools visible={true} incident={cfg.toolsIncident} />
      <Packets
        gateBlocks={cfg.gateBlocks}
        count={lowEnd ? 6 : cfg.packetCount}
        decisionMode={cfg.packetDecision}
      />

      {/* Post-processing */}
      {!lowEnd && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            intensity={0.8}
          />
        </EffectComposer>
      )}
    </Canvas>
  )
}

