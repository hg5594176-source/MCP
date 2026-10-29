import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type NeuralOrbMode = 'idle' | 'listening' | 'thinking' | 'booking';

interface NeuralOrb3DProps {
  mode?: NeuralOrbMode;
  interactive?: boolean;
  className?: string;
  onOrbClick?: () => void;
}

export const NeuralOrb3D: React.FC<NeuralOrb3DProps> = ({
  mode = 'idle',
  interactive = true,
  className = '',
  onOrbClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const reqIdRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Core Group
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 1. Inner Crystalline Polyhedron (Icosahedron)
    const innerGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    orbGroup.add(innerMesh);

    // 2. Middle Cybernetic Core Ring
    const torusGeo = new THREE.TorusGeometry(2.1, 0.04, 16, 100);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.rotation.x = Math.PI / 3;
    orbGroup.add(torusMesh);

    const torus2Mesh = torusMesh.clone();
    torus2Mesh.rotation.y = Math.PI / 4;
    torus2Mesh.rotation.x = -Math.PI / 5;
    (torus2Mesh.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
    orbGroup.add(torus2Mesh);

    // 3. Ambient Particle Swarm
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00f0ff);
    const color2 = new THREE.Color(0x8b5cf6);
    const color3 = new THREE.Color(0x10b981);

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution on sphere surface + randomized depth
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 2.4 + (Math.random() - 0.5) * 0.8;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      const mixedColor = Math.random() > 0.4 ? color1.clone().lerp(color2, Math.random()) : color3;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    orbGroup.add(particlePoints);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x090d16, 2.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 4, 15);
    cyanLight.position.set(3, 3, 4);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0x8b5cf6, 4, 15);
    violetLight.position.set(-3, -3, 3);
    scene.add(violetLight);

    // Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.8;
      mouseRef.current.targetY = y * 0.8;
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = x * 0.5;
      mouseRef.current.targetY = y * 0.5;
    };

    container.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleWindowMouseMove);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth mouse easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base rotation
      let speedMult = 1.0;
      if (mode === 'listening') speedMult = 2.4;
      if (mode === 'thinking') speedMult = 1.8;
      if (mode === 'booking') speedMult = 0.8;

      orbGroup.rotation.y += delta * 0.35 * speedMult;
      orbGroup.rotation.x = mouseRef.current.y * 0.35 + Math.sin(time * 0.6) * 0.08;
      orbGroup.rotation.z = mouseRef.current.x * 0.25;

      torusMesh.rotation.z += delta * 0.6 * speedMult;
      torus2Mesh.rotation.y += delta * 0.4 * speedMult;

      // Dynamic particle pulsing based on mode
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        let pulseFactor = 1.0;
        if (mode === 'listening') {
          pulseFactor = 1.0 + Math.sin(time * 6 + i * 0.1) * 0.15;
        } else if (mode === 'thinking') {
          pulseFactor = 1.0 + Math.sin(time * 3 + i * 0.05) * 0.08;
        } else if (mode === 'booking') {
          pulseFactor = 1.0 + Math.sin(time * 2 + i * 0.2) * 0.05;
        } else {
          // Idle breathing
          pulseFactor = 1.0 + Math.sin(time * 1.5 + i * 0.03) * 0.04;
        }

        posArray[i * 3] = ox * pulseFactor;
        posArray[i * 3 + 1] = oy * pulseFactor;
        posArray[i * 3 + 2] = oz * pulseFactor;
      }
      posAttr.needsUpdate = true;

      // Color shifts based on mode
      if (mode === 'booking') {
        innerMat.color.setHex(0x10b981);
        innerMat.emissive.setHex(0x059669);
        cyanLight.color.setHex(0x10b981);
      } else if (mode === 'thinking') {
        innerMat.color.setHex(0xa855f7);
        innerMat.emissive.setHex(0x7e22ce);
        cyanLight.color.setHex(0xa855f7);
      } else if (mode === 'listening') {
        innerMat.color.setHex(0x38bdf8);
        innerMat.emissive.setHex(0x0284c7);
        cyanLight.color.setHex(0x38bdf8);
      } else {
        innerMat.color.setHex(0x00f0ff);
        innerMat.emissive.setHex(0x0284c7);
        cyanLight.color.setHex(0x00f0ff);
      }

      // Lights position tracking
      cyanLight.position.x = 3 + mouseRef.current.x * 2;
      cyanLight.position.y = 3 + mouseRef.current.y * 2;

      renderer.render(scene, camera);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth || 500;
      const newH = container.clientHeight || 500;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      resizeObserver.disconnect();

      // Dispose Three resources
      innerGeo.dispose();
      innerMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mode, interactive]);

  if (!hasWebGL) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-cyan-950/20 border border-cyan-500/30 ${className}`}
        style={{ width: '100%', height: '100%', minHeight: '360px' }}
      >
        <div className="text-center p-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyan-500/20 animate-pulse border border-cyan-400" />
          <p className="text-cyan-400 font-mono text-sm">3D Neural Core Fallback</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={onOrbClick}
      className={`relative w-full h-full min-h-[380px] md:min-h-[480px] cursor-grab active:cursor-grabbing ${className}`}
      data-cursor="explore"
      title="Interactive 3D Neural Core — Move cursor to navigate, click to interact"
    />
  );
};
