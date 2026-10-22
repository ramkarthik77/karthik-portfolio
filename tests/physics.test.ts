import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  step,
  idleControls,
  nearby,
  respawn,
  rampHeight,
} from "../src/world/physics.ts";
const drive = (
  s: ReturnType<typeof createState>,
  input: Partial<ReturnType<typeof idleControls>>,
  seconds: number,
  vehicle: "car" | "bike" = "car",
) => {
  for (let i = 0; i < seconds * 120; i++)
    step(s, { ...idleControls(), ...input }, vehicle, 1 / 120);
};
test("free steering changes heading and leaves a fixed circuit", () => {
  const s = createState();
  s.x = 0;
  s.z = 22;
  s.heading = Math.PI / 2;
  drive(s, { throttle: 1, steering: 0.6 }, 2);
  assert.ok(s.heading > Math.PI / 2 + 0.3);
  assert.ok(Math.hypot(s.x, s.z - 22) > 5);
});
test("braking reduces speed; reverse moves behind the car", () => {
  const s = createState();
  s.x = 0;
  s.z = 21;
  drive(s, { throttle: 1 }, 1);
  const speed = Math.hypot(s.vx, s.vz);
  drive(s, { brake: true }, 1);
  assert.ok(Math.hypot(s.vx, s.vz) < speed / 3);
  const x = s.x;
  drive(s, { throttle: -1 }, 1);
  assert.ok(s.x < x);
});
test("building collisions prevent crossing solid footprint", () => {
  const s = createState();
  s.x = -38;
  s.z = 21;
  s.heading = Math.PI;
  drive(s, { throttle: 1, boost: true }, 2);
  assert.ok(s.z >= 14.5);
});
test("boost increases speed and bike handling differs", () => {
  const a = createState(),
    b = createState();
  for (const s of [a, b]) {
    s.x = -15;
    s.z = 21;
  }
  drive(a, { throttle: 1 }, 1);
  drive(b, { throttle: 1, boost: true }, 1);
  assert.ok(Math.hypot(b.vx, b.vz) > Math.hypot(a.vx, a.vz));
  const c = createState(),
    d = createState();
  drive(c, { throttle: 1, steering: 1 }, 1, "car");
  drive(d, { throttle: 1, steering: 1 }, 1, "bike");
  assert.notEqual(c.heading, d.heading);
});
test("cone impact pushes prop and respawn resets momentum", () => {
  const s = createState();
  s.x = -14;
  s.z = 18;
  s.heading = Math.PI / 2;
  drive(s, { throttle: 1 }, 0.8);
  assert.ok(s.cones[0].x > -12);
  respawn(s);
  assert.equal(s.vx, 0);
  assert.equal(s.y, 0);
  assert.notEqual(nearby(s), -1);
});
test("large frame delta is capped and ramp has a launch edge", () => {
  const s = createState();
  step(s, { ...idleControls(), throttle: 1 }, "car", 10);
  assert.ok(s.distance < 1);
  assert.ok(rampHeight(17, -3.9) > 3);
  assert.equal(rampHeight(17, -4.1), 0);
});
test("lap needs ordered checkpoints before a time can finish", () => {
  const s = createState();
  s.x = 0;
  s.z = 46;
  step(s, idleControls(), "car", 1 / 120);
  assert.equal(s.checkpoint, 1);
  step(s, idleControls(), "car", 1 / 120);
  assert.equal(s.bestLap, null);
  for (const [x, z] of [
    [68, 0],
    [0, -46],
    [-68, 0],
    [0, 46],
  ]) {
    s.x = x;
    s.z = z;
    step(s, idleControls(), "car", 1 / 120);
  }
  assert.ok(s.bestLap !== null);
});

test("guided tour reaches all destinations without crossing a building", async () => {
  const { guide } = await import("../src/world/tour.ts");
  const s = createState();
  s.x = -30;
  s.z = 24;
  let index = 0;
  const visits: number[] = [];
  for (let frame = 0; frame < 120 * 70; frame++) {
    const result = guide(s, index);
    index = result.index;
    if (result.visit !== undefined) visits.push(result.visit);
    if (result.ended) break;
    step(s, idleControls(), "car", 1 / 120);
  }
  assert.deepEqual(visits, [0, 1, 2, 3, 4]);
});
