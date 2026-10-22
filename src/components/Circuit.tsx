import { memo, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { RefObject } from "react";
import type { State } from "../world/physics";
import type { Mood, Vehicle, CameraMode } from "../world/config";
import { palettes } from "../world/config";
import Scenery from "../world/Scenery";
import Vehicles from "../world/Vehicles";
type Props = {
  state: RefObject<State>;
  vehicle: Vehicle;
  mood: Mood;
  near: number;
  cameraMode: CameraMode;
  reduced: boolean;
  low: boolean;
  intro: boolean;
};
function World({
  state,
  vehicle,
  mood,
  near,
  cameraMode,
  reduced,
  low,
  intro,
}: Props) {
  const rig = useRef<THREE.Group>(null),
    lean = useRef<THREE.Group>(null);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []),
    target = useMemo(() => new THREE.Vector3(), []),
    look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = state.current;
    if (rig.current) {
      rig.current.position.set(s.x, s.y + 0.05, s.z);
      rig.current.rotation.y = s.heading;
    }
    if (lean.current) {
      lean.current.rotation.z =
        vehicle === "bike"
          ? -s.steering * Math.min(Math.hypot(s.vx, s.vz) / 25, 0.4)
          : s.steering * 0.035;
      lean.current.rotation.x = s.pitch;
    }
    if (cameraMode === "chase" && !reduced && !intro) {
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
    } else {
      cameraPosition.set(s.x + 36, intro ? 48 : 38, s.z + 42);
      target.set(s.x, intro ? 0 : 1, s.z - 5);
    }
    const blend = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 3);
    camera.position.lerp(cameraPosition, blend);
    look.lerp(target, blend);
    camera.lookAt(look);
  });
  const p = palettes[mood];
  return (
    <>
      <color attach="background" args={[p.sky]} />
      <fog attach="fog" args={[p.sky, 150, 350]} />
      <hemisphereLight
        args={[
          mood === "night" ? "#bdd0ee" : "#fff3dc",
          p.ground,
          mood === "night" ? 1.3 : 2,
        ]}
      />
      <directionalLight
        position={[-40, 70, 30]}
        intensity={mood === "night" ? 1.4 : 3.5}
        color={p.sun}
        castShadow={!low}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.08}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={95}
        shadow-camera-bottom={-95}
        shadow-camera-far={240}
      />
      <Environment resolution={64}>
        <Lightformer
          position={[0, 25, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[60, 60, 1]}
          intensity={2}
        />
        <Lightformer
          position={[-20, 10, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[40, 10, 1]}
          color={p.sun}
          intensity={2}
        />
      </Environment>
      <Scenery mood={mood} state={state} near={near} />
      <group ref={rig}>
        <group ref={lean}>
          <Vehicles kind={vehicle} state={state} />
        </group>
        {mood === "night" && (
          <pointLight
            position={[0, 2, 2]}
            color="#ffe1ad"
            intensity={35}
            distance={15}
          />
        )}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[2.1, 24]} />
          <meshBasicMaterial
            color="#263743"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}
function Circuit(props: Props) {
  return (
    <Canvas
      shadows={!props.low}
      dpr={props.low ? 1 : [1, 1.5]}
      camera={{ position: [12, 48, 66], fov: 43, near: 0.1, far: 500 }}
      gl={{ antialias: !props.low, powerPreference: "high-performance" }}
    >
      <World {...props} />
    </Canvas>
  );
}

export default memo(Circuit);
