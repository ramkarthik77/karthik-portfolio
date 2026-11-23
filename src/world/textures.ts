import * as THREE from "three";

// Procedural surface textures, generated once on a canvas so the world gets
// realistic grain without downloading image files.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(
  size: number,
  seed: number,
  draw: (ctx: CanvasRenderingContext2D, random: () => number) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx, rng(seed));
  return canvas;
}

function speckle(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  size: number,
  count: number,
  min: number,
  max: number,
  radius: number,
) {
  for (let i = 0; i < count; i++) {
    const v = Math.round(min + random() * (max - min));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const r = radius * (0.4 + random());
    ctx.fillRect(random() * size, random() * size, r, r);
  }
}

function blotches(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  size: number,
  count: number,
  tone: string,
  alpha: number,
  radius: number,
) {
  ctx.fillStyle = tone;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * (0.4 + random() * 0.6);
    const x = random() * size,
      y = random() * size,
      r = radius * (0.5 + random());
    // draw wrapped copies so the texture tiles seamlessly
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, r, r * (0.6 + random() * 0.6), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  ctx.globalAlpha = 1;
}

let asphalt: { map: THREE.Texture; bump: THREE.Texture } | null = null;
let ground: THREE.Texture | null = null;

function toTexture(canvas: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Asphalt colour variation (multiplies the road colour) and a matching bump/roughness map. */
export function asphaltTextures() {
  if (asphalt) return asphalt;
  const size = 512;
  const colour = paint(size, 7, (ctx, random) => {
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, size, size);
    blotches(ctx, random, size, 22, "#d6d6d6", 0.16, 70);
    blotches(ctx, random, size, 16, "#ffffff", 0.14, 60);
    speckle(ctx, random, size, 34000, 190, 255, 1.3);
    speckle(ctx, random, size, 2400, 130, 175, 1.2);
  });
  const bump = paint(size, 11, (ctx, random) => {
    ctx.fillStyle = "#b4b4b4";
    ctx.fillRect(0, 0, size, size);
    speckle(ctx, random, size, 42000, 120, 255, 1.5);
    blotches(ctx, random, size, 20, "#d8d8d8", 0.25, 80);
  });
  if (!colour || !bump) return null;
  asphalt = { map: toTexture(colour, true), bump: toTexture(bump, false) };
  return asphalt;
}

/** Soft mottling for the infield and verges. */
export function groundTexture() {
  if (ground) return ground;
  const size = 512;
  const canvas = paint(size, 23, (ctx, random) => {
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(0, 0, size, size);
    blotches(ctx, random, size, 40, "#d6d6d6", 0.3, 55);
    blotches(ctx, random, size, 30, "#ffffff", 0.35, 45);
    speckle(ctx, random, size, 9000, 205, 255, 1.8);
  });
  if (!canvas) return null;
  ground = toTexture(canvas, true);
  return ground;
}

/** A clone that shares the image but has its own tiling. */
export function tiled(texture: THREE.Texture | undefined, x: number, y: number) {
  if (!texture) return undefined;
  const t = texture.clone();
  t.repeat.set(x, y);
  t.needsUpdate = true;
  return t;
}
