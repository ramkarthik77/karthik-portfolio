# Motorsport portfolio — first interactive milestone

The default experience is a garage with a custom sports car and rider/bike model, three lighting moods, and a circuit. Existing profile content remains available through Quick Profile; its decorative canvas is disabled in that view so it also works without WebGL.

- Choose Sports car or Superbike, plus Day, Sunset or Neon night. Validated preferences persist where browser storage is available.
- Guided lap advances around five destinations and pauses while each native dialog is open.
- Drive yourself uses arrows/WASD or pointer controls. Steering moves within the track boundaries; this is an assisted circuit, not a physics simulator. Release accelerator to slow down.
- Destination buttons give direct access to the same content. Escape closes panels and focus returns to the invoking control.
- Reduced camera motion disables garage sway and uses an elevated chase view. Driving still moves; use Quick Profile for a static experience.
- No downloaded models, external environment textures, engine audio or invented achievements are included. Models are procedural concept assets, not photorealistic licensed vehicles. Opening garage doors, advanced reflections, tire physics and cinematic video are future asset/animation work.

## Verification

TypeScript and Vite build succeeded. Repository lint ran with an existing Date-in-render warning in the preserved Profile. Browser checked vehicle/mood selection and destination dialogs. The available preview browser reports WebGL disabled: the fallback was verified, but 3D rendering, tour progression and real mobile frame rate remain unverified. Do not present this milestone as movie-quality finished graphics.

## Before production

Review on WebGL-enabled desktop and iPhone: inspect both vehicles/all moods, complete a guided lap (all five panels), drive/steer/brake with keyboard and touch, switch back to garage, verify reduced motion and preference persistence, and inspect Quick Profile. Check narrow-screen readability and performance. Existing main-only Cloudflare deployment is unchanged; this branch does not deploy to production.
