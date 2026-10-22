import { useEffect, useRef, useState } from "react";
import { createState, idleControls, nearby, respawn, step } from "./physics";
import type { Controls } from "./physics";
import type { DriveMode, Vehicle } from "./config";
import { destinations } from "./config";
import { guide } from "./tour";
export function useDriving({
  vehicle,
  mode,
  paused,
  onVisit,
  onTourEnd,
}: {
  vehicle: Vehicle;
  mode: DriveMode;
  paused: boolean;
  onVisit: (i: number) => void;
  onTourEnd: () => void;
}) {
  const state = useRef(createState()),
    controls = useRef(idleControls()),
    routeIndex = useRef(0);
  const params = useRef({ vehicle, mode, paused, onVisit, onTourEnd });
  const [snapshot, setSnapshot] = useState(createState);
  useEffect(() => {
    params.current = { vehicle, mode, paused, onVisit, onTourEnd };
  }, [vehicle, mode, paused, onVisit, onTourEnd]);
  useEffect(() => {
    let frame = 0,
      previous = 0,
      accumulator = 0,
      lastUi = 0;
    const animate = (time: number) => {
      const delta = previous ? Math.min((time - previous) / 1000, 0.1) : 0;
      previous = time;
      const p = params.current;
      if (!p.paused && !document.hidden) {
        accumulator += delta;
        while (accumulator >= 1 / 120) {
          let input = controls.current;
          if (p.mode === "tour") {
            const result = guide(state.current, routeIndex.current);
            routeIndex.current = result.index;
            if (result.ended) {
              p.onTourEnd();
              accumulator = 0;
              break;
            }
            if (result.visit !== undefined) {
              p.onVisit(result.visit);
              accumulator = 0;
              break;
            }
            input = idleControls();
          }
          step(state.current, input, p.vehicle, 1 / 120);
          accumulator -= 1 / 120;
        }
      } else {
        accumulator = 0;
        controls.current = idleControls();
      }
      if (time - lastUi > 80) {
        lastUi = time;
        setSnapshot({
          ...state.current,
          cones: state.current.cones.map((c) => ({ ...c })),
        });
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  function reset() {
    respawn(state.current);
    controls.current = idleControls();
    setSnapshot({
      ...state.current,
      cones: state.current.cones.map((c) => ({ ...c })),
    });
  }
  function startTour() {
    Object.assign(state.current, { x: -30, z: 24, vx: 0, vz: 0, y: 0, vy: 0 });
    routeIndex.current = 0;
  }
  return {
    state,
    controls,
    snapshot,
    near: nearby(snapshot),
    reset,
    startTour,
  };
}
export function useKeys(
  controls: ReturnType<typeof useDriving>["controls"],
  enabled: boolean,
  onInteract: () => void,
  onReset: () => void,
  onMap: () => void,
) {
  const callbacks = useRef({ onInteract, onReset, onMap });
  useEffect(() => {
    callbacks.current = { onInteract, onReset, onMap };
  }, [onInteract, onReset, onMap]);
  useEffect(() => {
    const keys = new Set<string>();
    const sync = () => {
      controls.current = {
        throttle:
          +(keys.has("w") || keys.has("arrowup")) -
          +(keys.has("s") || keys.has("arrowdown")),
        steering:
          +(keys.has("a") || keys.has("arrowleft")) -
          +(keys.has("d") || keys.has("arrowright")),
        brake: keys.has(" ") || keys.has("b"),
        boost: keys.has("shift"),
      };
    };
    const down = (e: KeyboardEvent) => {
      if (
        !enabled ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
          "b",
          "shift",
        ].includes(key)
      ) {
        if ((e.target as HTMLElement)?.tagName === "BUTTON" && key === " ")
          return;
        e.preventDefault();
        keys.add(key);
        sync();
      }
      if (!e.repeat) {
        if (key === "e" || key === "enter") {
          if ((e.target as HTMLElement)?.tagName !== "BUTTON")
            callbacks.current.onInteract();
        }
        if (key === "r") callbacks.current.onReset();
        if (key === "m") callbacks.current.onMap();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      sync();
    };
    const reset = () => {
      keys.clear();
      controls.current = idleControls();
    };
    const visibility = () => {
      if (document.hidden) reset();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
      reset();
    };
  }, [controls, enabled]);
}
export function controlValue(
  action: string,
  controls: Controls,
  held: boolean,
) {
  if (action === "left")
    controls.steering = held
      ? 1
      : controls.steering === 1
        ? 0
        : controls.steering;
  if (action === "right")
    controls.steering = held
      ? -1
      : controls.steering === -1
        ? 0
        : controls.steering;
  if (action === "go")
    controls.throttle = held
      ? 1
      : controls.throttle === 1
        ? 0
        : controls.throttle;
  if (action === "reverse")
    controls.throttle = held
      ? -1
      : controls.throttle === -1
        ? 0
        : controls.throttle;
  if (action === "brake") controls.brake = held;
  if (action === "boost") controls.boost = held;
}
export function nearestName(index: number) {
  return index >= 0 ? destinations[index].name : "Open road";
}
