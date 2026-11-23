import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { State } from "./physics";
import type { Mood, Vehicle } from "./config";

// Tyre smoke and skid marks from the rear wheels whenever the car is sliding
// (handbrake turns, hard drifts) or launching on nitro from low speed.

const SMOKE = 220;
const MARKS = 360; // segments per wheel
const REAR_Z = -1.36,
  REAR_X = 1.0;

const smokeVertex = /* glsl */ `
  attribute float aAge;
  attribute float aSize;
  uniform float uScale;
  varying float vAge;
  void main() {
    vAge = aAge;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aAge >= 1.0 ? 0.0 : aSize * (1.0 + aAge * 2.6) * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const smokeFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAge;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * (1.0 - vAge) * 0.42;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

function wheelWorld(s: State, side: number, out: THREE.Vector3) {
  const c = Math.cos(s.heading),
    n = Math.sin(s.heading),
    lx = side * REAR_X;
  return out.set(s.x + lx * c + REAR_Z * n, 0, s.z - lx * n + REAR_Z * c);
}

export default function DriftFX({
  state,
  vehicle,
  mood,
  reduced,
}: {
  state: RefObject<State>;
  vehicle: Vehicle;
  mood: Mood;
  reduced: boolean;
}) {
  const smoke = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SMOKE * 3), 3));
    geometry.setAttribute("aAge", new THREE.BufferAttribute(new Float32Array(SMOKE).fill(1), 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(SMOKE).fill(1), 1));
    return { geometry };
  }, []);
  const uniforms = useMemo(
    () => ({ uScale: { value: 400 }, uColor: { value: new THREE.Color() } }),
    [],
  );
  const material = useRef<THREE.ShaderMaterial>(null);
  const points = useRef<THREE.Points>(null);
  const marks = useRef<THREE.InstancedMesh>(null);
  // Per-frame simulation state lives in a ref so it can change between renders.
  const sim = useRef({
    velocity: new Float32Array(SMOKE * 3),
    next: 0,
    carry: 0,
    last: [new THREE.Vector3(), new THREE.Vector3()],
    valid: [false, false],
    markNext: 0,
    ready: false,
  });
  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), o: new THREE.Object3D() }),
    [],
  );

  useFrame(({ camera, gl }, delta) => {
    const s = state.current;
    const f = sim.current;
    const u = material.current?.uniforms;
    const dt = Math.min(delta, 0.05);
    const speed = Math.hypot(s.vx, s.vz);
    const grounded = s.y < 0.3;
    const sliding = vehicle === "car" && grounded && Math.abs(s.slip) > 4 && speed > 5;
    const launch = vehicle === "car" && grounded && s.boosting && speed < 12;

    // ---- smoke ----
    if (u && camera instanceof THREE.PerspectiveCamera)
      u.uScale.value =
        gl.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    u?.uColor.value.set(mood === "night" ? "#9aa3c4" : "#e9e4da");
    const geo = points.current?.geometry;
    if (!geo) return;
    const pos = geo.attributes.position as THREE.BufferAttribute,
      age = geo.attributes.aAge as THREE.BufferAttribute,
      size = geo.attributes.aSize as THREE.BufferAttribute;
    const rate = reduced ? 0 : sliding ? Math.min(Math.abs(s.slip) * 14, 180) : launch ? 90 : 0;
    f.carry += rate * dt;
    while (f.carry >= 1) {
      f.carry -= 1;
      const i = f.next;
      f.next = (f.next + 1) % SMOKE;
      wheelWorld(s, i % 2 ? 1 : -1, tmp.p);
      pos.setXYZ(i, tmp.p.x + (Math.random() - 0.5) * 0.4, 0.3, tmp.p.z + (Math.random() - 0.5) * 0.4);
      f.velocity[i * 3] = -s.vx * 0.12 + (Math.random() - 0.5) * 1.6;
      f.velocity[i * 3 + 1] = 0.5 + Math.random() * 0.7;
      f.velocity[i * 3 + 2] = -s.vz * 0.12 + (Math.random() - 0.5) * 1.6;
      age.setX(i, 0);
      size.setX(i, 0.9 + Math.random() * 0.8);
    }
    for (let i = 0; i < SMOKE; i++) {
      const a = age.getX(i);
      if (a >= 1) continue;
      age.setX(i, Math.min(1, a + dt / 1.7));
      const v = f.velocity;
      v[i * 3] *= 1 - dt * 1.5;
      v[i * 3 + 2] *= 1 - dt * 1.5;
      pos.setXYZ(i, pos.getX(i) + v[i * 3] * dt, pos.getY(i) + v[i * 3 + 1] * dt, pos.getZ(i) + v[i * 3 + 2] * dt);
    }
    pos.needsUpdate = age.needsUpdate = size.needsUpdate = true;

    // ---- skid marks ----
    const mesh = marks.current;
    if (!mesh) return;
    if (!f.ready) {
      tmp.o.scale.set(0, 0, 0);
      tmp.o.updateMatrix();
      for (let i = 0; i < MARKS * 2; i++) mesh.setMatrixAt(i, tmp.o.matrix);
      f.ready = true;
      mesh.instanceMatrix.needsUpdate = true;
    }
    const marking = sliding || (launch && speed > 1);
    for (const side of [0, 1]) {
      const p = wheelWorld(s, side ? 1 : -1, tmp.p);
      const last = f.last[side];
      const dist = p.distanceTo(last);
      if (!marking || dist > 3) {
        f.valid[side] = marking;
        last.copy(p);
        continue;
      }
      if (!f.valid[side]) {
        f.valid[side] = true;
        last.copy(p);
        continue;
      }
      if (dist < 0.3) continue;
      const o = tmp.o;
      o.position.set((p.x + last.x) / 2, 0.05, (p.z + last.z) / 2);
      o.rotation.set(-Math.PI / 2, Math.atan2(p.x - last.x, p.z - last.z), 0, "YXZ");
      o.scale.set(1, dist + 0.05, 1);
      o.updateMatrix();
      mesh.setMatrixAt(f.markNext, o.matrix);
      f.markNext = (f.markNext + 1) % (MARKS * 2);
      mesh.instanceMatrix.needsUpdate = true;
      last.copy(p);
    }
  });

  return (
    <>
      <points ref={points} geometry={smoke.geometry} frustumCulled={false} renderOrder={3}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={smokeVertex}
          fragmentShader={smokeFragment}
          transparent
          depthWrite={false}
        />
      </points>
      <instancedMesh ref={marks} args={[undefined, undefined, MARKS * 2]} frustumCulled={false}>
        <planeGeometry args={[0.3, 1]} />
        <meshBasicMaterial color="#0d0d0f" transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>
    </>
  );
}
