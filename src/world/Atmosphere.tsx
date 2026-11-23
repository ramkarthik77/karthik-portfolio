import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import type { Mood } from "./config";
import { looks } from "./looks";

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  uniform vec3 bottom;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform float sunDisc;
  uniform float glow;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = h > 0.0
      ? mix(horizon, top, pow(smoothstep(0.0, 1.0, h), 0.6))
      : mix(horizon, bottom, smoothstep(0.0, -0.3, h));
    float s = max(dot(d, normalize(sunDir)), 0.0);
    col += sunColor * (pow(s, 6.0) * 0.25 + pow(s, 48.0) * 0.6) * glow;
    col += sunColor * smoothstep(1.0 - sunDisc, 1.0 - sunDisc * 0.5, s) * 4.0 * glow;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Gradient sky dome with a sun (or moon) glow that the bloom pass picks up. */
export function Sky({ mood }: { mood: Mood }) {
  const look = looks[mood];
  const dome = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => {
    const [sx, sy, sz] = look.sun;
    return {
      top: { value: new THREE.Color(look.skyTop) },
      horizon: { value: new THREE.Color(look.skyHorizon) },
      bottom: { value: new THREE.Color(look.skyBottom) },
      sunDir: { value: new THREE.Vector3(sx, sy, sz).normalize() },
      sunColor: { value: new THREE.Color(look.sunColor) },
      sunDisc: { value: 0.0016 },
      glow: { value: mood === "night" ? 0.35 : mood === "sunset" ? 1.1 : 0.7 },
    };
  }, [look, mood]);
  useFrame(({ camera }) => dome.current?.position.copy(camera.position));
  return (
    <mesh ref={dome} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[450, 48, 24]} />
      <shaderMaterial
        key={mood}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

export function NightSky({ mood, still }: { mood: Mood; still: boolean }) {
  if (mood !== "night") return null;
  return (
    <Stars
      radius={320}
      depth={60}
      count={2600}
      factor={5}
      saturation={0}
      fade
      speed={still ? 0 : 0.3}
    />
  );
}
