# Motor Park

The portfolio is now an open driving world. The player is not attached to a circular path. Career, work, introduction, milestones, and contact content live at five destinations in a custom motorsport park.

## Experience

- Sports car and motorcycle with different acceleration, grip and turning response.
- Free movement, reverse, boost, braking/drifting, building collisions, movable cones, a launch ramp, and an ordered four-checkpoint lap timer.
- A guided tour visits all five destinations and pauses for the content panels.
- Overview and chase cameras; daylight, sunset, and night palettes; optional synthesized engine sound.
- Native modal dialogs, map navigation, Quick Profile, reduced camera motion, performance mode, keyboard and multitouch controls.
- If WebGL initialization fails, the same driving simulation remains playable in a clearly labeled SVG 2D mode. The 3D version is still the default.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Accelerate, reverse, steer |
| Space / B | Brake |
| Shift | Boost |
| E / Enter | Open the nearby destination |
| M | Map and direct content navigation |
| R | Respawn at the nearest destination |

Touch buttons allow acceleration and steering simultaneously. Opening a panel, pausing, changing tabs or losing window focus clears held inputs. Sound starts only through the visitor's sound button.

## Implementation

`src/world/physics.ts` owns a fixed-step arcade simulation. `tour.ts` defines the guided route. `useDriving.ts` runs the simulation at 120 Hz and publishes UI snapshots at roughly 12 Hz. The memoized Three.js scene reads position refs each render frame. `Scenery.tsx` and `Vehicles.tsx` contain original procedural models; no Bruno Simon code, models, music or branding was copied.

The visual direction is a stylized miniature motorsport park. It is not a photorealistic racing simulator. Collision bodies use simplified footprints. Trees are decorative. Lap timing is local to the current session and accepts ordered checkpoint visits, not server-validated competitive racing. Motorcycle balance is assisted. Sound is synthesized, not a recorded engine.

## Validation and remaining device check

`npm test` exercises steering, reverse/braking, building collisions, boost, motorcycle differences, cone impact, respawn, frame-delta limits, ramp geometry, checkpoint order and the complete guided route.

TypeScript/Vite production build and repository lint run before publication. Browser checks cover the fallback, automatic arrival dialog, content/map navigation and configuration controls. The cloud browser disables WebGL, so actual 3D materials, lighting, camera framing, mobile GPU performance and multitouch ergonomics still require a WebGL-enabled desktop/phone check. This limitation is not a failed production build.

## Delivery

The existing Cloudflare production deployment remains main-only. Same-repository PRs now deploy their already-tested build artifact to a separate `pr-N` Cloudflare Pages branch. The preview job does not check out or run repository scripts with deployment credentials, and is skipped for fork PRs. The preview URL is printed in the workflow summary.
