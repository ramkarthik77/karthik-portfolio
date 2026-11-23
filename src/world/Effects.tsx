import { useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { ChromaticAberrationEffect, DepthOfFieldEffect } from "postprocessing";
import * as THREE from "three";
import type { Mood } from "./config";
import type { State } from "./physics";
import { looks } from "./looks";

export type Tier = "high" | "medium" | "low";

/**
 * Film-style finishing: ambient occlusion, bloom on lights and the sun,
 * a shallow depth of field on the welcome shot, colour grade, vignette and grain.
 * "medium" keeps only the cheap passes for phones; "low" renders without a composer.
 */
export default function Effects({
  tier,
  mood,
  intro,
  reduced,
  state,
}: {
  tier: Tier;
  mood: Mood;
  intro: boolean;
  reduced: boolean;
  state: RefObject<State>;
}) {
  const dof = useRef<DepthOfFieldEffect>(null);
  const fringe = useRef<ChromaticAberrationEffect>(null);
  const kick = useRef(0);
  // Hold focus between the car and the park centre so the welcome shot's subject stays sharp.
  useFrame((_, delta) => {
    const s = state.current;
    dof.current?.target?.set(s.x * 0.4, 2, s.z * 0.4 - 4);
    // Lens fringing that swells while nitro is lit.
    const goal = s.boosting && !reduced ? 1 : 0;
    kick.current += (goal - kick.current) * Math.min(1, delta * 5);
    fringe.current?.offset.set(0.0026 * kick.current, 0.0016 * kick.current);
  });
  if (tier === "low") return null;
  const high = tier === "high";
  const look = looks[mood];
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {high ? (
        <N8AO
          aoRadius={1.3}
          distanceFalloff={0.6}
          intensity={mood === "night" ? 1.6 : 2.4}
          quality="medium"
        />
      ) : (
        <></>
      )}
      {high && intro && !reduced ? (
        <DepthOfField
          ref={dof}
          target={[0, 1, 0]}
          focalLength={0.08}
          bokehScale={1.8}
          height={720}
        />
      ) : (
        <></>
      )}
      <Bloom
        mipmapBlur
        intensity={look.bloom}
        luminanceThreshold={0.95}
        luminanceSmoothing={0.2}
        radius={0.72}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <HueSaturation saturation={mood === "night" ? 0.04 : 0.1} />
      <BrightnessContrast contrast={0.08} brightness={mood === "night" ? 0.01 : 0.02} />
      <ChromaticAberration
        ref={fringe}
        offset={new THREE.Vector2(0, 0)}
        radialModulation
        modulationOffset={0.25}
      />
      <Vignette offset={0.28} darkness={high ? 0.55 : 0.4} />
      <SMAA />
    </EffectComposer>
  );
}
