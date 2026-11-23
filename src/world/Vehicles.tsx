import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "./physics";
import type { Vehicle } from "./config";
import StreetCar from "./StreetCar";
import type { RefObject } from "react";
export function Block({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = "#edf0da",
  radius = 0.08,
  metal = 0.15,
  glow = 0,
  rough = 0.35,
  emissive,
}: {
  p?: [number, number, number];
  s?: [number, number, number];
  color?: string;
  radius?: number;
  metal?: number;
  glow?: number;
  rough?: number;
  /** Emissive colour when it should differ from the base colour (e.g. lit windows). */
  emissive?: string;
}) {
  return (
    <RoundedBox
      position={p}
      args={s}
      radius={radius}
      smoothness={2}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={rough}
        metalness={metal}
        emissive={emissive ?? color}
        emissiveIntensity={glow}
      />
    </RoundedBox>
  );
}
function Shell({
  points,
  color,
  p = [0, 0, 0],
  width,
  glass = false,
}: {
  points: [number, number][];
  color: string;
  p?: [number, number, number];
  width: number;
  glass?: boolean;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    points.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
    s.closePath();
    return s;
  }, [points]);
  return (
    <mesh
      rotation={[0, -Math.PI / 2, 0]}
      position={[p[0] + width / 2, p[1], p[2]]}
      castShadow
    >
      <extrudeGeometry
        args={[
          shape,
          {
            depth: width,
            bevelEnabled: true,
            bevelSize: 0.06,
            bevelThickness: 0.05,
            bevelSegments: 2,
            steps: 1,
          },
        ]}
      />
      {glass ? (
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={2.2}
        />
      ) : (
        // Metallic automotive paint: base flake layer under a glossy clearcoat.
        <meshPhysicalMaterial
          color={color}
          metalness={0.62}
          roughness={0.34}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.35}
        />
      )}
    </mesh>
  );
}
const FAIRING: [number, number][] = [
  [-0.8, 0.7],
  [-0.3, 1.25],
  [0.45, 1.45],
  [1.12, 1.12],
  [0.65, 0.58],
];
function Wheel({
  x,
  z,
  bike = false,
  state,
  front = false,
}: {
  x: number;
  z: number;
  bike?: boolean;
  state?: RefObject<State>;
  front?: boolean;
}) {
  const spin = useRef<THREE.Group>(null),
    steer = useRef<THREE.Group>(null);
  useFrame(() => {
    if (spin.current && state)
      spin.current.rotation.x = state.current.distance / (bike ? 0.5 : 0.44);
    if (steer.current && state)
      steer.current.rotation.y = front ? state.current.steering * 0.35 : 0;
  });
  const r = bike ? 0.5 : 0.44,
    w = bike ? 0.23 : 0.35;
  return (
    <group position={[x, r, z]} ref={steer}>
      <group ref={spin}>
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[r - 0.1, 0.12, 12, 32]} />
          <meshStandardMaterial color="#16191c" roughness={0.92} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[r - 0.12, r - 0.12, w, 28]} />
          <meshStandardMaterial
            color="#2a3036"
            metalness={0.9}
            roughness={0.28}
          />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i} rotation={[(i / 5) * Math.PI * 2, 0, 0]}>
            <Block
              p={[0, 0, 0]}
              s={[w + 0.02, 0.065, r * 1.5]}
              color="#d9dee2"
              radius={0.02}
              metal={1}
              rough={0.22}
            />
          </group>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, w + 0.05, 12]} />
          <meshStandardMaterial color="#f78b4e" />
        </mesh>
      </group>
    </group>
  );
}
export default function Vehicles({
  kind,
  state,
  paint = "#ed7540",
  accent = "#14181c",
  caliper = "#f2f2f2",
  livery = false,
  glow = "",
  glowLevel = 1,
}: {
  kind: Vehicle;
  state?: RefObject<State>;
  paint?: string;
  accent?: string;
  caliper?: string;
  livery?: boolean;
  /** Underglow colour; empty for none. */
  glow?: string;
  /** Underglow brightness; dimmer in daylight. */
  glowLevel?: number;
}) {
  return kind === "car" ? (
    <StreetCar
      body={paint}
      accent={accent}
      caliper={caliper}
      livery={livery}
      glow={glow}
      glowLevel={glowLevel}
      state={state}
    />
  ) : (
    <group>
      <Wheel x={0} z={1.12} bike front state={state} />
      <Wheel x={0} z={-1.16} bike state={state} />
      <Block p={[0, 0.62, -0.05]} s={[0.32, 0.42, 1.5]} color="#263742" />
      <Shell points={FAIRING} width={0.6} color={paint} />
      <Block p={[0, 1.21, -0.65]} s={[0.48, 0.14, 0.83]} color="#263742" />
      <Block p={[0, 1.34, -1.1]} s={[0.33, 0.1, 0.45]} color={paint} />
      <Block p={[0, 1.4, -1.1]} s={[0.08, 0.02, 0.46]} color={accent} />
      {glow && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <planeGeometry args={[1.4, 3.2]} />
            <meshBasicMaterial
              color={new THREE.Color(glow).multiplyScalar(1.6)}
              transparent
              opacity={0.35}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[0, 0.3, 0]} color={glow} intensity={5} distance={4} decay={2} />
        </>
      )}
      <mesh position={[0, 1.5, 0.72]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.47, 0.45, 0.06]} />
        <meshPhysicalMaterial
          color="#6f93a0"
          transparent
          opacity={0.55}
          metalness={0.3}
          roughness={0.04}
          clearcoat={1}
        />
      </mesh>
      <Block p={[0, 1.45, 0.5]} s={[1, 0.08, 0.08]} color="#344853" />
      {[-0.15, 0.15].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.83, 1.1]} rotation={[-0.15, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.85, 8]} />
            <meshStandardMaterial color="#c9b88d" metalness={0.7} />
          </mesh>
          <mesh position={[x, 1.62, 0.05]} rotation={[0.85, 0, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
            <meshStandardMaterial color="#293a43" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.67, -0.4]} rotation={[0.65, 0, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.43, 6, 12]} />
        <meshStandardMaterial color="#364b55" />
      </mesh>
      {[-0.29, 0.29].map((x) => (
        <mesh
          key={x}
          position={[x, 1.1, -0.4]}
          rotation={[-0.5, 0, 0]}
          castShadow
        >
          <capsuleGeometry args={[0.11, 0.62, 4, 8]} />
          <meshStandardMaterial color="#334650" />
        </mesh>
      ))}
      <mesh position={[0, 2.12, 0]} castShadow>
        <sphereGeometry args={[0.29, 20, 16]} />
        <meshStandardMaterial color="#f1e8ce" roughness={0.25} />
      </mesh>
      <Block p={[0, 2.13, 0.25]} s={[0.4, 0.13, 0.09]} color="#243b48" />
      <Block
        p={[0, 1.16, 1.1]}
        s={[0.36, 0.1, 0.08]}
        color="#fff0c9"
        glow={5}
      />
      <Block
        p={[0, 1.36, -1.31]}
        s={[0.26, 0.05, 0.05]}
        color="#ed4a4a"
        glow={3.5}
      />
    </group>
  );
}
