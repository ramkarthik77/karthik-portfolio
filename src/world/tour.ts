import type { State } from "./physics.ts";
export const tourRoute = [
  { x: -30, z: 20, stop: 0 },
  { x: -30, z: -25 },
  { x: -38, z: -25, stop: 1 },
  { x: -30, z: -25 },
  { x: 25, z: -25, stop: 2 },
  { x: 35, z: -25 },
  { x: 35, z: 18 },
  { x: 43, z: 18, stop: 3 },
  { x: 35, z: 21 },
  { x: 0, z: 21 },
  { x: 0, z: 48, stop: 4 },
];
export function guide(
  s: State,
  index: number,
): { index: number; visit?: number; ended?: boolean } {
  const point = tourRoute[index];
  if (!point) return { index, ended: true };
  const dx = point.x - s.x,
    dz = point.z - s.z,
    distance = Math.hypot(dx, dz);
  if (distance < 1.3) {
    if (point.stop !== undefined) {
      s.vx = 0;
      s.vz = 0;
    }
    return { index: index + 1, visit: point.stop };
  }
  s.heading = Math.atan2(dx, dz);
  s.vx = Math.sin(s.heading) * Math.min(8, distance * 3);
  s.vz = Math.cos(s.heading) * Math.min(8, distance * 3);
  return { index };
}
