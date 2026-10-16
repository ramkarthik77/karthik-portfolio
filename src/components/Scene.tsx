import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { profile } from '../data/profile'

/** 100+ "sites" orbiting the platform core, on three tilted rings. */
function SiteNodes({ count = 108 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const ring = i % 3
      const r = 2.3 + ring * 0.45
      const a = (i / count) * Math.PI * 2 * 3 + ring
      const tilt = [0.35, -0.5, 1.1][ring]
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      p[i * 3] = x
      p[i * 3 + 1] = z * Math.sin(tilt)
      p[i * 3 + 2] = z * Math.cos(tilt)
    }
    return p
  }, [count])

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.08
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#7dd3fc" sizeAttenuation transparent opacity={0.9} />
      </points>
    </group>
  )
}

function Core() {
  const wire = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (wire.current) {
      wire.current.rotation.x += dt * 0.1
      wire.current.rotation.y -= dt * 0.15
    }
  })
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh>
        <icosahedronGeometry args={[1.25, 12]} />
        <MeshDistortMaterial color="#ff5a3c" roughness={0.3} metalness={0.1} distort={0.35} speed={1.6} />
      </mesh>
      <mesh ref={wire} scale={1.75}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.25} />
      </mesh>
    </Float>
  )
}

function Avatar({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Center>
        <primitive object={scene} scale={1.8} />
      </Center>
    </Float>
  )
}

/** Subtle camera drift that follows the pointer. */
function Rig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04
    camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      <pointLight position={[-4, -2, 2]} intensity={30} color="#7dd3fc" />
      <Suspense fallback={null}>
        {profile.avatarUrl ? <Avatar url={profile.avatarUrl} /> : <Core />}
      </Suspense>
      <SiteNodes />
      <Rig />
    </Canvas>
  )
}
