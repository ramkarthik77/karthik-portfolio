import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import { destinations, palettes } from "./config";
import type { Mood } from "./config";
import type { State } from "./physics";
import Vehicles, { Block } from "./Vehicles";

function Sign({
  text,
  p,
  width = 9,
  height = 2,
  ground = false,
  color = "#f5edda",
}: {
  text: string;
  p: [number, number, number];
  width?: number;
  height?: number;
  ground?: boolean;
  color?: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.font = "900 90px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 128, 980);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={p} rotation={ground ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
function Road({ mood }: { mood: Mood }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.absellipse(0, 0, 74, 52, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, 62, 40, 0, Math.PI * 2, true, 0);
    s.holes.push(hole);
    return s;
  }, []);
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.025, 0]}
        receiveShadow
      >
        <shapeGeometry args={[shape, 100]} />
        <meshStandardMaterial color={palettes[mood].road} roughness={0.9} />
      </mesh>
      <Block
        p={[0, 0.015, 21]}
        s={[115, 0.03, 13]}
        color={palettes[mood].road}
      />
      <Block
        p={[-30, 0.015, -5]}
        s={[13, 0.03, 65]}
        color={palettes[mood].road}
      />
      <Block
        p={[0, 0.015, -25]}
        s={[92, 0.03, 13]}
        color={palettes[mood].road}
      />
      <Block
        p={[35, 0.015, -4]}
        s={[13, 0.03, 60]}
        color={palettes[mood].road}
      />
      <Block
        p={[0, 0.015, 40]}
        s={[13, 0.03, 37]}
        color={palettes[mood].road}
      />
      {Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[68 * Math.cos(a), 0.06, 46 * Math.sin(a)]}
            rotation={[0, -a, 0]}
          >
            <mesh>
              <boxGeometry args={[0.15, 0.03, 1.2]} />
              <meshBasicMaterial color="#eee2bd" />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: 120 }, (_, i) => {
        const a = (i / 120) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[74.5 * Math.cos(a), 0.1, 52.5 * Math.sin(a)]}
            rotation={[0, -a, 0]}
          >
            <mesh receiveShadow>
              <boxGeometry args={[0.75, 0.2, 2.4]} />
              <meshStandardMaterial color={i % 2 ? "#e7d8bd" : "#ce7155"} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[-5.4 + i * 1.2, 0.075, 45.5]}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[0, 0, j * 0.8]}>
              <boxGeometry args={[1.2, 0.02, 0.8]} />
              <meshBasicMaterial color={(i + j) % 2 ? "#e7dec7" : "#303f47"} />
            </mesh>
          ))}
        </group>
      ))}
      <Sign
        text="START / FINISH"
        p={[0, 0.09, 51]}
        ground
        width={11}
        height={2}
      />
    </group>
  );
}
function Building({ index, mood }: { index: number; mood: Mood }) {
  const d = destinations[index],
    color = palettes[mood].building;
  return (
    <group position={[d.building[0], 0, d.building[1]]}>
      <Block p={[0, 0.15, 0]} s={[19, 0.3, 14]} color="#9da795" />
      <Block p={[0, 2.5, 0]} s={[16, 5, 11]} color={color} radius={0.3} />
      <Block p={[0, 5.25, 0]} s={[17, 0.5, 12]} color={d.color} radius={0.12} />
      <Block
        p={[0, 3.2, 5.57]}
        s={[14, 2.6, 0.13]}
        color="#3e5962"
        radius={0.05}
      />
      {[-5, -1.6, 1.6, 5].map((x) => (
        <Block
          key={x}
          p={[x, 3.2, 5.68]}
          s={[0.15, 2.65, 0.12]}
          color={color}
        />
      ))}
      <Block p={[0, 4.5, 5.9]} s={[15, 0.8, 0.3]} color="#293d46" />
      <Sign
        text={
          [
            "KARTHIK’S GARAGE",
            "CAREER PADDOCK",
            "INNOVATION LAB",
            "MILESTONE GALLERY",
            "THE CLUBHOUSE",
          ][index]
        }
        p={[0, 4.55, 6.07]}
        width={13}
        height={0.9}
      />
      {index === 0 && (
        <>
          <Block p={[-4, 1.2, 5.8]} s={[5, 2.4, 0.2]} color="#344650" />
          <Block p={[4, 1.2, 5.8]} s={[5, 2.4, 0.2]} color="#344650" />
          <group position={[-4, 0.3, 0]}>
            <Vehicles kind="car" paint="#9ec8bf" />
          </group>
          <group position={[4, 0.3, 0]}>
            <Vehicles kind="bike" paint="#ecb04d" />
          </group>
        </>
      )}
      {index === 1 && (
        <>
          {["ADOBE", "T-MOBILE", "ABBVIE"].map((name, i) => (
            <group key={name} position={[-5 + i * 5, 0, 8]}>
              <Block p={[0, 1, 0]} s={[3.8, 2, 0.4]} color={d.color} />
              <Sign
                text={name}
                p={[0, 1.1, 0.24]}
                width={3.4}
                height={0.7}
                color="#30424b"
              />
            </group>
          ))}
        </>
      )}
      {index === 2 && (
        <>
          <mesh position={[0, 7.4, 0]} castShadow>
            <icosahedronGeometry args={[2, 0]} />
            <meshStandardMaterial
              color={d.color}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 7.4, 0]} rotation={[0.5, 0, 0.6]}>
            <torusGeometry args={[2.8, 0.08, 8, 40]} />
            <meshStandardMaterial color="#f1e2ad" />
          </mesh>
        </>
      )}
      {index === 3 && (
        <>
          <mesh position={[0, 7, 0]} castShadow>
            <cylinderGeometry args={[1.6, 0.7, 2.8, 12]} />
            <meshStandardMaterial color="#e5bc62" metalness={0.5} />
          </mesh>
          <Block p={[0, 5.7, 0]} s={[3, 0.5, 3]} color="#495a5e" />
        </>
      )}
      {index === 4 && (
        <>
          {[-5, 5].map((x) => (
            <group key={x} position={[x, 0, -8]}>
              <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 4, 8]} />
                <meshStandardMaterial color="#eef1df" />
              </mesh>
              <mesh position={[0, 4, 0]}>
                <coneGeometry args={[3, 0.7, 8]} />
                <meshStandardMaterial color={d.color} />
              </mesh>
              <Block p={[0, 0.9, 0]} s={[2, 0.15, 2]} color="#ece0bf" />
            </group>
          ))}
        </>
      )}
      <Block p={[-7, 5.75, -2]} s={[0.8, 1, 0.8]} color="#60757b" />
      <Block p={[-6, 6.4, -2]} s={[3, 0.12, 2]} color="#304953" />
    </group>
  );
}
const treeLocations = Array.from({ length: 38 }, (_, i) => {
  const a = i * 2.399;
  return {
    x: Math.cos(a) * (80 + (i % 3) * 3),
    z: Math.sin(a) * (58 + (i % 4) * 2),
    scale: 0.8 + (i % 5) * 0.15,
  };
});
function Trees({ mood }: { mood: Mood }) {
  return (
    <group>
      {treeLocations.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} scale={p.scale}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.4, 2.6, 6]} />
            <meshStandardMaterial color="#8b7761" />
          </mesh>
          {[0, 1].map((j) => (
            <mesh key={j} position={[0, 3.4 + j * 1.5, 0]} castShadow>
              <coneGeometry args={[2.2 - j * 0.6, 3.5, 6]} />
              <meshStandardMaterial
                color={
                  mood === "night" ? "#486777" : i % 3 ? "#6e8c79" : "#a8a16c"
                }
                flatShading
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
function Props({ state }: { state: RefObject<State> }) {
  const cones = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    state.current.cones.forEach((c, i) => {
      const mesh = cones.current[i];
      if (mesh) {
        mesh.position.set(c.x, 0.03, c.z);
        mesh.rotation.z = c.tilt;
      }
    });
  });
  return (
    <group>
      {state.current.cones.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            cones.current[i] = el;
          }}
        >
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.85, 0.18, 0.85]} />
            <meshStandardMaterial color="#3c4651" />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <coneGeometry args={[0.33, 1, 8]} />
            <meshStandardMaterial color="#ee8753" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.17, 0.23, 0.2, 8]} />
            <meshStandardMaterial color="#f2e4c9" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export default function Scenery({
  mood,
  state,
  near,
}: {
  mood: Mood;
  state: RefObject<State>;
  near: number;
}) {
  const p = palettes[mood];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[1500, 1500]} />
        <meshStandardMaterial color={p.water} roughness={0.4} metalness={0.1} />
      </mesh>
      <Block p={[0, -1, 0]} s={[198, 2, 152]} color={p.ground} radius={1} />
      <Road mood={mood} />
      <Trees mood={mood} />
      {destinations.map((d, i) => (
        <group key={d.id}>
          <Building index={i} mood={mood} />
          <mesh position={[d.x, 0.08, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.8, 5.15, 48]} />
            <meshBasicMaterial
              color={d.color}
              transparent
              opacity={near === i ? 1 : 0.55}
            />
          </mesh>
          <Sign
            text={`${d.number} / ${d.name.toUpperCase()}`}
            p={[d.x, 0.12, d.z + 6.5]}
            width={15}
            height={1.8}
            ground
            color={mood === "night" ? "#e8ebdb" : "#344852"}
          />
        </group>
      ))}
      <group position={[-2, 0, 0]}>
        <Block p={[0, 1, 0]} s={[16, 2, 14]} color={p.grass} radius={0.3} />
        <Block p={[0, 2.2, 0]} s={[5, 0.4, 5]} color="#b5b29c" />
        <Block p={[0, 6, 0]} s={[1.6, 7.2, 1.6]} color="#ed8755" />
        <Block p={[0, 10, 0]} s={[9, 2, 2.2]} color="#f0d8ad" />
        <Sign
          text="KG / MOTOR PARK"
          p={[0, 10, 1.13]}
          width={8}
          height={1.4}
          color="#344650"
        />
        <mesh position={[0, 13, 0]} rotation={[0.25, 0.5, 0.2]} castShadow>
          <icosahedronGeometry args={[2, 0]} />
          <meshStandardMaterial color="#e9bb62" metalness={0.4} />
        </mesh>
      </group>
      <group position={[17, 0, 0]}>
        <mesh rotation={[0, 0, 0]} receiveShadow>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  -3.5, 0, 5, 3.5, 0, 5, -3.5, 3.24, -4, 3.5, 0, 5, 3.5, 3.24,
                  -4, -3.5, 3.24, -4,
                ]),
                3,
              ]}
            />
            <bufferAttribute
              attach="attributes-normal"
              args={[
                new Float32Array(
                  Array.from({ length: 6 }, () => [0, 0.941, 0.339]).flat(),
                ),
                3,
              ]}
            />
          </bufferGeometry>
          <meshStandardMaterial color="#c6a785" side={THREE.DoubleSide} />
        </mesh>
        <Sign
          text="AIR TIME ↑"
          p={[0, 0.08, 8]}
          width={7}
          height={1.5}
          ground
          color="#354a52"
        />
      </group>
      <group position={[0, 0, 46]}>
        {[-9, 9].map((x) => (
          <Block key={x} p={[x, 4.2, 0]} s={[0.5, 8.4, 0.5]} color="#334b55" />
        ))}
        <Block p={[0, 8.5, 0]} s={[19, 1.8, 1]} color="#f0cf79" />
        <Sign
          text="THE PERSONAL CIRCUIT"
          p={[0, 8.55, 0.52]}
          width={17}
          height={1.4}
          color="#354b51"
        />
      </group>
      {[-1, 1].flatMap((side) =>
        Array.from({ length: 5 }, (_, i) => (
          <group key={`${side}${i}`} position={[side * (20 + i * 9), 0, -58]}>
            <Block
              p={[0, 1 + (i % 2) * 0.4, 0]}
              s={[7, 2, 4]}
              color={i % 2 ? "#d6b26d" : "#9eafa1"}
            />
            <Block p={[0, 2.2, 0]} s={[7, 0.4, 4]} color="#e2d5ae" />
          </group>
        )),
      )}
      <Sign
        text="KARTHIK GUDURI"
        p={[-27, 0.09, 31]}
        ground
        width={28}
        height={4}
        color={mood === "night" ? "#e0dfcf" : "#44564f"}
      />
      <Sign
        text="AEM / CLOUD / AI"
        p={[-27, 0.09, 35]}
        ground
        width={20}
        height={2}
        color={mood === "night" ? "#e0dfcf" : "#6b7262"}
      />
      <Props state={state} />
    </group>
  );
}
