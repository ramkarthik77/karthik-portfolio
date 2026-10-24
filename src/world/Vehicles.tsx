import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "./physics";
import type { Vehicle } from "./config";
import type { RefObject } from "react";
export function Block({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = "#edf0da",
  radius = 0.08,
  metal = 0.15,
  glow = 0,
}: {
  p?: [number, number, number];
  s?: [number, number, number];
  color?: string;
  radius?: number;
  metal?: number;
  glow?: number;
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
        roughness={0.35}
        metalness={metal}
        emissive={color}
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
}: {
  points: [number, number][];
  color: string;
  p?: [number, number, number];
  width: number;
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
      <meshPhysicalMaterial
        color={color}
        metalness={0.45}
        roughness={0.25}
        clearcoat={1}
      />
    </mesh>
  );
}
const BODY: [number, number][] = [
  [-2.2, 0.42],
  [-2.18, 0.87],
  [-1.5, 1],
  [-0.5, 1.02],
  [0.8, 0.91],
  [1.9, 0.74],
  [2.18, 0.5],
  [2.12, 0.36],
];
const CABIN: [number, number][] = [
  [-1.2, 1],
  [-0.55, 1.65],
  [0.5, 1.57],
  [1.1, 0.94],
];
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
          <torusGeometry args={[r - 0.1, 0.12, 8, 24]} />
          <meshStandardMaterial color="#202b31" roughness={0.85} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[r - 0.12, r - 0.12, w, 20]} />
          <meshStandardMaterial
            color="#34404b"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i} rotation={[(i / 5) * Math.PI * 2, 0, 0]}>
            <Block
              p={[0, 0, 0]}
              s={[w + 0.02, 0.065, r * 1.5]}
              color="#dce2d7"
              radius={0.02}
              metal={0.7}
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
}: {
  kind: Vehicle;
  state?: RefObject<State>;
  paint?: string;
}) {
  return kind === "car" ? (
    <group>
      <Shell points={BODY} width={1.95} color={paint} />
      <Shell points={CABIN} width={1.5} color="#30434c" />
      <Block p={[0, 1.63, -0.05]} s={[1.48, 0.07, 0.8]} color={paint} />
      <Block p={[0, 0.97, 1.2]} s={[0.23, 0.025, 1.05]} color="#f5e3c6" />
      <Block p={[0, 1.02, -1.65]} s={[0.23, 0.025, 0.65]} color="#f5e3c6" />
      <Block p={[0, 0.38, 2.12]} s={[1.98, 0.09, 0.2]} color="#24343e" />
      {[-1.02, 1.02].flatMap((x) =>
        [-1.38, 1.34].map((z) => (
          <Wheel key={`${x},${z}`} x={x} z={z} front={z > 0} state={state} />
        )),
      )}
      {[-0.71, 0.71].map((x) => (
        <group key={x}>
          <Block
            p={[x, 0.68, 1.99]}
            s={[0.45, 0.09, 0.12]}
            color="#fff0cc"
            glow={2}
          />
          <Block
            p={[x, 0.7, -2.19]}
            s={[0.5, 0.07, 0.06]}
            color="#f34d43"
            glow={1.5}
          />
          <Block p={[x, 1.17, -1.75]} s={[0.06, 0.44, 0.1]} color="#273a45" />
        </group>
      ))}
      <Block p={[0, 1.4, -1.82]} s={[2.16, 0.09, 0.37]} color="#263944" />
      {[-1.1, 1.1].map((x) => (
        <Block
          key={x}
          p={[x, 1.08, 0.45]}
          s={[0.23, 0.12, 0.32]}
          color={paint}
        />
      ))}
    </group>
  ) : (
    <group>
      <Wheel x={0} z={1.12} bike front state={state} />
      <Wheel x={0} z={-1.16} bike state={state} />
      <Block p={[0, 0.62, -0.05]} s={[0.32, 0.42, 1.5]} color="#263742" />
      <Shell points={FAIRING} width={0.6} color={paint} />
      <Block p={[0, 1.21, -0.65]} s={[0.48, 0.14, 0.83]} color="#263742" />
      <Block p={[0, 1.34, -1.1]} s={[0.33, 0.1, 0.45]} color={paint} />
      <mesh position={[0, 1.5, 0.72]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.47, 0.45, 0.06]} />
        <meshPhysicalMaterial
          color="#789ba5"
          transparent
          opacity={0.7}
          metalness={0.2}
          roughness={0.1}
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
        glow={2}
      />
      <Block
        p={[0, 1.36, -1.31]}
        s={[0.26, 0.05, 0.05]}
        color="#ed4a4a"
        glow={2}
      />
    </group>
  );
}
