import { lazy, memo, Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import type { RefObject } from "react";
import type { State } from "../world/physics";
import type { Mood, Vehicle, CameraMode } from "../world/config";
import Scenery from "../world/Scenery";
import Vehicles from "../world/Vehicles";
import DriftFX from "../world/DriftFX";
import { glows, paints } from "../world/garage";
import type { Garage } from "../world/garage";
import { NightSky, Sky } from "../world/Atmosphere";
import { looks } from "../world/looks";
import type { Tier } from "../world/Effects";

// Post-processing is loaded separately so the park renders before the finishing passes arrive.
const Effects = lazy(() => import("../world/Effects"));

type Props = {
  state: RefObject<State>;
  vehicle: Vehicle;
  mood: Mood;
  near: number;
  cameraMode: CameraMode;
  reduced: boolean;
  low: boolean;
  intro: boolean;
  garage: Garage;
};

/** ?quality=high|medium|low pins the render tier (useful for demos and screenshots). */
function pinnedTier(): Tier | null {
  try {
    const q = new URLSearchParams(location.search).get("quality");
    return q === "high" || q === "medium" || q === "low" ? q : null;
  } catch {
    return null;
  }
}
function deviceTier(): Tier {
  try {
    return matchMedia("(max-width: 760px), (pointer: coarse)").matches
      ? "medium"
      : "high";
  } catch {
    return "medium";
  }
}
const DPR: Record<Tier, number | [number, number]> = {
  // [1, 2] renders at native sharpness up to 2x, i.e. true 4K on a 4K display.
  high: [1, 2],
  medium: [1, 1.5],
  low: 1,
};
const SHADOW_MAP: Record<Tier, number> = { high: 4096, medium: 2048, low: 1024 };

function Headlights({ mood }: { mood: Mood }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  if (mood === "day") return null;
  return (
    <>
      <primitive object={target} position={[0, 0, 16]} />
      <spotLight
        position={[0, 1.1, 2.3]}
        target={target}
        color="#ffe6bd"
        intensity={mood === "night" ? 260 : 90}
        distance={48}
        angle={0.52}
        penumbra={0.75}
        decay={1.6}
      />
    </>
  );
}

function World({
  state,
  vehicle,
  mood,
  near,
  cameraMode,
  reduced,
  tier,
  intro,
  garage,
}: Omit<Props, "low"> & { tier: Tier }) {
  const rig = useRef<THREE.Group>(null),
    lean = useRef<THREE.Group>(null);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []),
    target = useMemo(() => new THREE.Vector3(), []),
    look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock }, delta) => {
    const s = state.current;
    const speed = Math.hypot(s.vx, s.vz);
    if (rig.current) {
      rig.current.position.set(s.x, s.y + 0.05, s.z);
      rig.current.rotation.y = s.heading;
    }
    if (lean.current) {
      lean.current.rotation.z =
        vehicle === "bike"
          ? -s.steering * Math.min(speed / 25, 0.4)
          : s.steering * 0.035;
      lean.current.rotation.x = s.pitch;
    }
    const chase = cameraMode === "chase" && !reduced && !intro;
    if (chase) {
      cameraPosition.set(
        s.x - Math.sin(s.heading) * 15,
        9 + s.y,
        s.z - Math.cos(s.heading) * 15,
      );
      target.set(
        s.x + Math.sin(s.heading) * 5,
        1 + s.y,
        s.z + Math.cos(s.heading) * 5,
      );
    } else if (intro && !reduced) {
      // Slow crane move over the park while the welcome card is up.
      const t = clock.elapsedTime;
      const angle = 0.71 + Math.sin(t * 0.07) * 0.32;
      const radius = 58 + Math.sin(t * 0.05) * 6;
      cameraPosition.set(
        s.x + Math.sin(angle) * radius,
        44 + Math.sin(t * 0.09) * 4,
        s.z + Math.cos(angle) * radius,
      );
      target.set(s.x, 0, s.z - 5);
    } else {
      cameraPosition.set(s.x + 36, intro ? 48 : 38, s.z + 42);
      target.set(s.x, intro ? 0 : 1, s.z - 5);
    }
    const blend = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 3);
    camera.position.lerp(cameraPosition, blend);
    look.lerp(target, blend);
    // A little shake on nitro in the chase view.
    if (chase && s.boosting) {
      const k = 0.06 * Math.min(speed / 25, 1);
      camera.position.x += (Math.random() - 0.5) * k;
      camera.position.y += (Math.random() - 0.5) * k;
    }
    camera.lookAt(look);
    // Widen the lens with speed in the chase view for a sense of pace, more on nitro.
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = chase
        ? 43 + Math.min(speed / 30, 1) * 11 + (s.boosting ? 7 : 0)
        : 43;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov += (fov - camera.fov) * Math.min(1, delta * 3);
        camera.updateProjectionMatrix();
      }
    }
  });
  const l = looks[mood];
  const shadows = tier !== "low";
  return (
    <>
      <fog attach="fog" args={[l.skyHorizon, l.fog[0], l.fog[1]]} />
      <Sky mood={mood} />
      <NightSky mood={mood} still={reduced} />
      <hemisphereLight args={[l.hemiSky, l.hemiGround, l.hemiIntensity]} />
      <directionalLight
        key={`${mood}-${tier}`}
        position={[...l.sun]}
        intensity={l.sunIntensity}
        color={l.sunColor}
        castShadow={shadows}
        shadow-mapSize={[SHADOW_MAP[tier], SHADOW_MAP[tier]]}
        shadow-radius={tier === "high" ? 5 : 3}
        shadow-bias={-0.00025}
        shadow-normalBias={0.06}
        shadow-camera-left={-115}
        shadow-camera-right={115}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={1}
        shadow-camera-far={320}
      />
      <Environment key={mood} resolution={256} frames={1}>
        <Lightformer
          form="rect"
          position={[0, 30, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[70, 70, 1]}
          intensity={mood === "night" ? 0.5 : 1.6}
          color={l.hemiSky}
        />
        <Lightformer
          form="rect"
          position={[-30, 8, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[50, 8, 1]}
          color={l.sunColor}
          intensity={mood === "night" ? 1 : 3}
        />
        <Lightformer
          form="rect"
          position={[30, 6, 10]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[40, 5, 1]}
          color={l.fill}
          intensity={1.2}
        />
        {mood === "night" && (
          <>
            <Lightformer
              form="rect"
              position={[-20, 5, -25]}
              rotation={[0, 0.6, 0]}
              scale={[30, 3, 1]}
              color="#ff2bd6"
              intensity={4}
            />
            <Lightformer
              form="rect"
              position={[22, 4, 25]}
              rotation={[0, -2.5, 0]}
              scale={[30, 3, 1]}
              color="#19e3ff"
              intensity={4}
            />
          </>
        )}
        <Lightformer
          form="ring"
          position={[0, 12, -30]}
          scale={14}
          color={l.sunColor}
          intensity={mood === "night" ? 1.5 : 2.5}
        />
      </Environment>
      <Scenery mood={mood} state={state} near={near} />
      <DriftFX state={state} vehicle={vehicle} mood={mood} reduced={reduced} />
      <group ref={rig}>
        <group ref={lean}>
          <Vehicles
            kind={vehicle}
            state={state}
            paint={paints[garage.paint].body}
            accent={paints[garage.paint].accent}
            caliper={paints[garage.paint].caliper}
            livery={garage.livery}
            glow={glows[garage.glow].color}
            glowLevel={mood === "night" ? 1 : mood === "sunset" ? 0.55 : 0.3}
          />
        </group>
        {shadows && <Headlights mood={mood} />}
        {mood === "night" && (
          <pointLight
            position={[0, 2, 2]}
            color="#ffe1ad"
            intensity={22}
            distance={14}
          />
        )}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <circleGeometry args={[2.3, 32]} />
          <meshBasicMaterial
            color="#10171c"
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      </group>
      {tier !== "low" && (
        <Suspense fallback={null}>
          <Effects
            tier={tier}
            mood={mood}
            intro={intro}
            reduced={reduced}
            state={state}
          />
        </Suspense>
      )}
    </>
  );
}

function Circuit(props: Props) {
  const [pinned] = useState(pinnedTier);
  const [adaptive, setAdaptive] = useState<Tier>(deviceTier);
  const tier: Tier = pinned ?? (props.low ? "low" : adaptive);
  const stepDown = () =>
    setAdaptive((t) => (t === "high" ? "medium" : "low"));
  return (
    <Canvas
      shadows={tier === "low" ? false : "percentage"}
      dpr={DPR[tier]}
      camera={{ position: [12, 48, 66], fov: 43, near: 0.5, far: 600 }}
      gl={{
        antialias: tier === "low",
        powerPreference: "high-performance",
        stencil: false,
      }}
    >
      {!pinned && (
        <PerformanceMonitor
          flipflops={2}
          onDecline={stepDown}
          onFallback={() => setAdaptive("low")}
        />
      )}
      <World
        state={props.state}
        vehicle={props.vehicle}
        mood={props.mood}
        near={props.near}
        cameraMode={props.cameraMode}
        reduced={props.reduced}
        intro={props.intro}
        tier={tier}
        garage={props.garage}
      />
    </Canvas>
  );
}

export default memo(Circuit);
