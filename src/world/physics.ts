import { colliders, coneStarts, destinations, spawn } from "./config.ts";
import type { Vehicle } from "./config.ts";
export type Controls = {
  throttle: number;
  steering: number;
  brake: boolean;
  boost: boolean;
};
export const idleControls = (): Controls => ({
  throttle: 0,
  steering: 0,
  brake: false,
  boost: false,
});
export type Cone = {
  x: number;
  z: number;
  vx: number;
  vz: number;
  tilt: number;
};
export type State = {
  x: number;
  z: number;
  vx: number;
  vz: number;
  heading: number;
  y: number;
  vy: number;
  pitch: number;
  steering: number;
  distance: number;
  cones: Cone[];
  checkpoint: number;
  lapStart: number | null;
  lapTime: number;
  bestLap: number | null;
  time: number;
};
export const createState = (): State => ({
  ...spawn,
  vx: 0,
  vz: 0,
  y: 0,
  vy: 0,
  pitch: 0,
  steering: 0,
  distance: 0,
  cones: coneStarts.map(([x, z]) => ({ x, z, vx: 0, vz: 0, tilt: 0 })),
  checkpoint: 0,
  lapStart: null,
  lapTime: 0,
  bestLap: null,
  time: 0,
});
export function respawn(s: State) {
  const nearest = destinations.reduce((a, b) =>
    Math.hypot(s.x - a.x, s.z - a.z) < Math.hypot(s.x - b.x, s.z - b.z) ? a : b,
  );
  Object.assign(s, {
    x: nearest.x,
    z: nearest.z + 3,
    vx: 0,
    vz: 0,
    heading: Math.PI / 2,
    y: 0,
    vy: 0,
    pitch: 0,
    checkpoint: 0,
    lapStart: null,
    lapTime: 0,
  });
}
export function nearby(s: State) {
  return destinations.findIndex((d) => Math.hypot(s.x - d.x, s.z - d.z) < 8);
}
export function rampHeight(x: number, z: number) {
  return Math.abs(x - 17) < 3.5 && z > -4 && z < 5 ? (5 - z) * 0.36 : 0;
}
export function onRoad(x: number, z: number) {
  const ring = Math.sqrt((x / 68) ** 2 + (z / 46) ** 2);
  return (
    Math.abs(ring - 1) < 0.13 ||
    (Math.abs(z - 21) < 7 && Math.abs(x) < 57) ||
    (Math.abs(x + 30) < 7 && z < 30 && z > -35) ||
    (Math.abs(z + 25) < 7 && Math.abs(x) < 45) ||
    (Math.abs(x - 35) < 7 && z > -30 && z < 30) ||
    (Math.abs(x) < 7 && z > 20 && z < 57)
  );
}
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const checkpoints = [
  [0, 46],
  [68, 0],
  [0, -46],
  [-68, 0],
];
export function step(s: State, input: Controls, vehicle: Vehicle, dt: number) {
  dt = clamp(dt, 0, 1 / 30);
  if (!dt) return;
  const oldX = s.x,
    oldZ = s.z,
    oldHeight = rampHeight(s.x, s.z);
  s.time += dt;
  const fx = Math.sin(s.heading),
    fz = Math.cos(s.heading);
  let forward = s.vx * fx + s.vz * fz;
  let lateral = s.vx * fz - s.vz * fx;
  const road = onRoad(s.x, s.z),
    grip = vehicle === "bike" ? 12 : input.brake ? 1.6 : 7;
  s.steering +=
    (clamp(input.steering, -1, 1) - s.steering) * Math.min(1, dt * 8);
  if (s.y < 0.2 || oldHeight > 0) {
    s.heading +=
      s.steering *
      clamp(forward / 8, -1, 1) *
      (vehicle === "bike" ? 1.65 : 1.2) *
      dt;
    forward +=
      clamp(input.throttle, -1, 1) *
      (vehicle === "bike" ? 17 : 14) *
      (input.boost ? 1.5 : 1) *
      dt;
    forward *= Math.exp(
      -(input.brake ? 5 : input.throttle === 0 ? 0.9 : road ? 0.25 : 0.75) * dt,
    );
    forward = clamp(
      forward,
      -8,
      input.boost ? 32 : vehicle === "bike" ? 25 : 22,
    );
    lateral *= Math.exp(-grip * dt);
    s.vx = Math.sin(s.heading) * forward + Math.cos(s.heading) * lateral;
    s.vz = Math.cos(s.heading) * forward - Math.sin(s.heading) * lateral;
  }
  s.x += s.vx * dt;
  s.z += s.vz * dt;
  const height = rampHeight(s.x, s.z);
  if (oldHeight > 2 && height === 0 && s.y >= oldHeight - 0.5)
    s.vy = 5 + Math.hypot(s.vx, s.vz) * 0.13;
  s.vy -= 17 * dt;
  s.y += s.vy * dt;
  if (s.y < height) {
    s.y = height;
    s.vy = 0;
  }
  s.pitch += ((height > 0 ? 0.25 : 0) - s.pitch) * Math.min(1, dt * 7);
  const radius = vehicle === "bike" ? 0.65 : 1.1;
  if (s.y < 3)
    for (const box of colliders) {
      const dx = s.x - box.x,
        dz = s.z - box.z,
        px = box.hx + radius - Math.abs(dx),
        pz = box.hz + radius - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) {
          s.x += Math.sign(dx || 1) * px;
          s.vx *= -0.25;
        } else {
          s.z += Math.sign(dz || 1) * pz;
          s.vz *= -0.25;
        }
      }
    }
  for (const cone of s.cones) {
    const dx = cone.x - s.x,
      dz = cone.z - s.z,
      dist = Math.hypot(dx, dz);
    if (dist < radius + 0.55 && s.y < 1.5) {
      const nx = dist > 0.001 ? dx / dist : 1,
        nz = dist > 0.001 ? dz / dist : 0;
      cone.x = s.x + nx * (radius + 0.56);
      cone.z = s.z + nz * (radius + 0.56);
      cone.vx = s.vx * 0.8 + nx * 3;
      cone.vz = s.vz * 0.8 + nz * 3;
      cone.tilt = 1.2;
    }
    cone.x += cone.vx * dt;
    cone.z += cone.vz * dt;
    cone.vx *= Math.exp(-2 * dt);
    cone.vz *= Math.exp(-2 * dt);
  }
  if (Math.abs(s.x) > 94 || Math.abs(s.z) > 71) {
    s.x = clamp(s.x, -94, 94);
    s.z = clamp(s.z, -71, 71);
    s.vx *= -0.35;
    s.vz *= -0.35;
  }
  s.distance += Math.hypot(s.x - oldX, s.z - oldZ);
  const cp = checkpoints[s.checkpoint];
  if (Math.hypot(s.x - cp[0], s.z - cp[1]) < 9) {
    if (s.checkpoint === 0) {
      if (s.lapStart !== null) {
        s.lapTime = s.time - s.lapStart;
        s.bestLap =
          s.bestLap === null ? s.lapTime : Math.min(s.bestLap, s.lapTime);
      }
      s.lapStart = s.time;
    }
    s.checkpoint = (s.checkpoint + 1) % 4;
  }
  if (s.lapStart !== null) s.lapTime = s.time - s.lapStart;
}
