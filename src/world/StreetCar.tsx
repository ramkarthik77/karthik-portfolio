import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { State } from "./physics";
import { Block } from "./Vehicles";

// An original street-racing hypercar: low wedge body with real wheel arches,
// fender pods that rise over the wheels, carbon aero, LED light strips, livery,
// underglow and nitro flames. Forward is +z. Wheel centres: z 1.38 (front) / -1.36 (rear).

const R = 0.43; // wheel radius
const FRONT = 1.38,
  REAR = -1.36;
const CARBON = "#15181c";

function outline(points: [number, number][]) {
  const s = new THREE.Shape();
  points.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  return s;
}
/** Low centre tub: nose, hood, cowl and rear deck. Sits between the fender pods. */
const CENTRE: [number, number][] = [
  [2.42, 0.3], [-2.3, 0.3], [-2.36, 0.55], [-2.32, 0.86], [-1.75, 0.92], [-1.15, 0.96],
  [-0.2, 0.99], [0.95, 0.86], [1.5, 0.74], [2.0, 0.62], [2.36, 0.48], [2.44, 0.36],
];
/** Side pods: the fender line swells over each wheel, with the arches cut out. */
function podShape() {
  const s = new THREE.Shape();
  const sill = 0.28;
  const arch = (cz: number, r: number) => {
    const a = Math.asin((sill - R) / r);
    s.lineTo(cz + Math.cos(a) * r, sill);
    s.absarc(cz, R, r, a, Math.PI - a, false);
  };
  s.moveTo(2.44, sill);
  arch(FRONT, 0.5);
  arch(REAR, 0.52);
  (
    [
      [-2.34, sill], [-2.38, 0.55], [-2.34, 0.86], [-1.95, 0.98], [-1.36, 1.08], [-0.75, 1.0],
      [0.15, 0.88], [0.8, 0.92], [1.38, 1.04], [1.95, 0.9], [2.3, 0.66], [2.46, 0.42],
    ] as [number, number][]
  ).forEach(([z, y]) => s.lineTo(z, y));
  s.closePath();
  return s;
}
const CANOPY: [number, number][] = [
  [-1.25, 0.9],
  [-0.55, 1.3],
  [0.25, 1.32],
  [1.0, 0.92],
];

/** Draws the livery onto the body's flanks. Shape units: z -2.5..2.5, y 0.15..1.05. */
function liveryTexture(body: string, accent: string) {
  const W = 1024,
    H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const px = (z: number) => ((z + 2.5) / 5) * W,
    py = (y: number) => (1 - (y - 0.15) / 0.9) * H;
  const poly = (pts: [number, number][], fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    pts.forEach(([z, y], i) =>
      i ? ctx.lineTo(px(z), py(y)) : ctx.moveTo(px(z), py(y)),
    );
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, W, H);
  // dark rocker band
  poly([[2.5, 0.15], [-2.5, 0.15], [-2.5, 0.42], [2.5, 0.36]], CARBON);
  // main swoosh, thick at the front arch, sharpening toward the tail
  poly(
    [[2.3, 0.44], [0.6, 0.52], [-1.0, 0.66], [-2.45, 0.84], [-2.45, 0.74], [-0.9, 0.55], [0.55, 0.4], [2.3, 0.36]],
    accent,
  );
  // pinstripe riding above it
  poly([[1.9, 0.6], [-0.9, 0.73], [-2.45, 0.9], [-2.45, 0.87], [-0.92, 0.7], [1.9, 0.57]], "#ffffff");
  // shark-gill slashes behind the front wheel
  for (let i = 0; i < 3; i++) {
    const z = 0.72 - i * 0.16;
    poly([[z, 0.78], [z - 0.06, 0.78], [z - 0.16, 0.5], [z - 0.1, 0.5]], i % 2 ? accent : CARBON);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // ExtrudeGeometry caps use the shape's own coordinates as UVs.
  t.repeat.set(1 / 5, 1 / 0.9);
  t.offset.set(2.5 / 5, -0.15 / 0.9);
  return t;
}

function paintProps(body: string) {
  const dark = new THREE.Color(body).getHSL({ h: 0, s: 0, l: 0 }).l < 0.12,
    pale = new THREE.Color(body).getHSL({ h: 0, s: 0, l: 0 }).l > 0.85;
  return {
    // Pigment under a glossy clearcoat: enough metal for flake sparkle without
    // turning thin edges dark at grazing angles.
    metalness: pale ? 0.15 : 0.35,
    roughness: dark ? 0.24 : 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.25,
  };
}

function RaceWheel({
  x,
  z,
  width,
  caliper,
  state,
  front = false,
}: {
  x: number;
  z: number;
  width: number;
  caliper: string;
  state?: RefObject<State>;
  front?: boolean;
}) {
  const spin = useRef<THREE.Group>(null),
    steer = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!state) return;
    if (spin.current) spin.current.rotation.x = state.current.distance / R;
    if (steer.current && front)
      steer.current.rotation.y = state.current.steering * 0.35;
  });
  const side = Math.sign(x),
    face = side * (width / 2);
  return (
    <group position={[x, R, z]} ref={steer}>
      {/* caliper stays put while the wheel spins */}
      <Block
        p={[face - side * 0.1, 0.17, -0.1]}
        s={[0.08, 0.14, 0.24]}
        color={caliper}
        radius={0.03}
      />
      <group ref={spin}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[R, R, width, 40]} />
          <meshStandardMaterial color="#141618" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[face - side * 0.14, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.03, 32]} />
          <meshStandardMaterial color="#8d949a" metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[face + side * 0.005, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.02, 40]} />
          <meshStandardMaterial color="#0c0e10" metalness={0.6} roughness={0.5} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <group key={i} rotation={[(i / 10) * Math.PI * 2 + (i % 2 ? 0.12 : 0), 0, 0]}>
            <mesh position={[face + side * 0.02, 0.16, 0]}>
              <boxGeometry args={[0.035, 0.3, 0.045]} />
              <meshStandardMaterial color="#d7dce0" metalness={1} roughness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[face + side * 0.03, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 6]} />
          <meshStandardMaterial color={caliper} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function radialGlow() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function Underglow({ color, level }: { color: string; level: number }) {
  const alpha = useMemo(() => radialGlow(), []);
  const tint = useMemo(
    () => new THREE.Color(color).multiplyScalar(2.2 * level),
    [color, level],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} renderOrder={2}>
        <planeGeometry args={[3.0, 5.6]} />
        <meshBasicMaterial
          color={tint}
          alphaMap={alpha ?? undefined}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0.25, 0]} color={color} intensity={9 * level} distance={5.5} decay={2} />
    </>
  );
}

function NitroFlames({ state }: { state?: RefObject<State> }) {
  const group = useRef<THREE.Group>(null);
  const outer = useMemo(() => new THREE.Color(5, 1.6, 0.35), []),
    inner = useMemo(() => new THREE.Color(1.6, 3, 6), []);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g || !state) return;
    const on = state.current.boosting;
    g.visible = on;
    if (on) {
      const t = clock.elapsedTime * 40;
      g.children.forEach((c, i) => {
        const f = 0.75 + Math.abs(Math.sin(t + i * 1.7)) * 0.5;
        c.scale.set(1, f, 1);
      });
    }
  });
  return (
    <group ref={group} visible={false}>
      {[-0.15, 0.15].map((x) => (
        <group key={x} position={[x, 0.34, -2.42]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.38]}>
            <coneGeometry args={[0.11, 0.8, 12, 1, true]} />
            <meshBasicMaterial
              color={outer}
              transparent
              opacity={0.8}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
            <coneGeometry args={[0.055, 0.45, 10, 1, true]} />
            <meshBasicMaterial
              color={inner}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function StreetCar({
  body,
  accent,
  caliper,
  livery,
  glow,
  glowLevel = 1,
  state,
}: {
  body: string;
  accent: string;
  caliper: string;
  livery: boolean;
  glow: string;
  glowLevel?: number;
  state?: RefObject<State>;
}) {
  const centre = useMemo(() => outline(CENTRE), []);
  const pod = useMemo(() => podShape(), []);
  const canopy = useMemo(() => outline(CANOPY), []);
  const map = useMemo(
    () => (livery ? liveryTexture(body, accent) : null),
    [livery, body, accent],
  );
  const paint = paintProps(body);
  const extrude = (depth: number, bevel: number) => ({
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 18,
  });
  return (
    <group>
      {/* centre tub */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[0.66, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[centre, extrude(1.32, 0.06)]} />
        <meshPhysicalMaterial color={body} {...paint} />
      </mesh>
      {/* fender pods: outer caps carry the livery, the rest is plain paint */}
      {[-1, 1].map((sx) => (
        <mesh
          key={sx}
          rotation={[0, -Math.PI / 2, 0]}
          position={[sx > 0 ? 1.16 : -0.7, 0, 0]}
          castShadow
          receiveShadow
        >
          <extrudeGeometry args={[pod, extrude(0.46, 0.06)]} />
          <meshPhysicalMaterial attach="material-0" color={map ? "#ffffff" : body} map={map} {...paint} />
          <meshPhysicalMaterial attach="material-1" color={body} {...paint} />
        </mesh>
      ))}
      {/* bubble canopy */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[0.62, 0, 0]} castShadow>
        <extrudeGeometry args={[canopy, { ...extrude(1.24, 0.12), bevelSegments: 5 }]} />
        <meshPhysicalMaterial
          color="#1c2a33"
          metalness={0.6}
          roughness={0.06}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={2.4}
        />
      </mesh>
      <Block p={[0, 1.42, -0.35]} s={[0.36, 0.1, 0.7]} color={CARBON} radius={0.04} rough={0.4} />
      {/* carbon aero */}
      <Block p={[0, 0.2, 2.34]} s={[2.4, 0.05, 0.42]} color={CARBON} radius={0.02} rough={0.4} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Block p={[sx * 1.17, 0.26, 0.01]} s={[0.12, 0.12, 1.6]} color={CARBON} radius={0.03} rough={0.4} />
          <Block p={[sx * 1.14, 0.4, 2.2]} s={[0.16, 0.03, 0.34]} color={CARBON} rough={0.4} />
          {/* side intake */}
          <mesh position={[sx * 1.21, 0.62, -0.42]}>
            <boxGeometry args={[0.04, 0.2, 0.55]} />
            <meshStandardMaterial color="#07090b" roughness={0.8} />
          </mesh>
          {/* mirror */}
          <Block p={[sx * 0.96, 1.02, 0.7]} s={[0.2, 0.09, 0.14]} color={body} radius={0.03} metal={paint.metalness} rough={paint.roughness} />
          {/* hood vent */}
          <mesh position={[sx * 0.3, 0.83, 1.35]} rotation={[0.22, 0, 0]}>
            <boxGeometry args={[0.36, 0.03, 0.34]} />
            <meshStandardMaterial color="#07090b" roughness={0.7} />
          </mesh>
          {/* LED headlight strips */}
          <group position={[sx * 0.9, 0.63, 2.33]} rotation={[0, sx * -0.38, sx * 0.1]}>
            <Block p={[0, 0, 0]} s={[0.5, 0.05, 0.06]} color="#e8f6ff" glow={7} />
            <Block p={[sx * 0.06, -0.07, 0.02]} s={[0.34, 0.025, 0.05]} color="#e8f6ff" glow={4} />
          </group>
          {/* rear wing uprights and endplates */}
          <Block p={[sx * 0.55, 1.12, -2.02]} s={[0.06, 0.4, 0.2]} color={CARBON} rough={0.4} />
          <Block p={[sx * 1.16, 1.32, -2.06]} s={[0.04, 0.26, 0.54]} color={CARBON} rough={0.4} />
        </group>
      ))}
      <mesh position={[0, 1.34, -2.06]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[2.3, 0.05, 0.48]} />
        <meshPhysicalMaterial color={CARBON} roughness={0.35} clearcoat={1} />
      </mesh>
      <Block p={[0, 1.37, -2.24]} s={[2.3, 0.03, 0.06]} color={accent} radius={0.01} />
      {/* diffuser with fins */}
      <Block p={[0, 0.3, -2.3]} s={[1.7, 0.16, 0.3]} color="#0b0d10" radius={0.02} rough={0.6} />
      {[-0.6, -0.3, 0.3, 0.6].map((x) => (
        <Block key={x} p={[x, 0.3, -2.42]} s={[0.03, 0.18, 0.12]} color={CARBON} />
      ))}
      {/* full-width tail light bar */}
      <Block p={[0, 0.78, -2.37]} s={[2.2, 0.05, 0.05]} color="#ff2a3a" glow={4} />
      {[-1.0, 1.0].map((x) => (
        <Block key={x} p={[x, 0.68, -2.39]} s={[0.05, 0.18, 0.05]} color="#ff2a3a" glow={4} />
      ))}
      {/* exhaust tips */}
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 0.34, -2.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.085, 0.14, 18, 1, true]} />
          <meshStandardMaterial color="#9aa0a6" metalness={1} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <NitroFlames state={state} />
      {[-1, 1].flatMap((sx) =>
        [
          { z: FRONT, w: 0.38 },
          { z: REAR, w: 0.44 },
        ].map((w) => (
          <RaceWheel
            key={`${sx},${w.z}`}
            x={sx * (w.z > 0 ? 0.97 : 1.0)}
            z={w.z}
            width={w.w}
            caliper={caliper}
            front={w.z > 0}
            state={state}
          />
        )),
      )}
      {glow && <Underglow color={glow} level={glowLevel} />}
    </group>
  );
}
