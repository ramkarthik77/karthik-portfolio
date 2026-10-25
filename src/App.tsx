import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { destinations } from "./world/config";
import type { Mood, Vehicle, DriveMode, CameraMode } from "./world/config";
import { controlValue, useDriving, useKeys } from "./world/useDriving";
import ParkMap from "./world/ParkMap";
import DestinationContent from "./world/DestinationContent";
import "./motorsport.css";
import "./experience-enhancements.css";
const Profile = lazy(() => import("./Profile"));
const Circuit = lazy(() => import("./components/Circuit"));
class SceneBoundary extends Component<
  { children: ReactNode; onUnavailable: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onUnavailable();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function saved<T extends string>(key: string, values: T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T;
    return values.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
function RideIcon({ bike = false }: { bike?: boolean }) {
  return (
    <svg viewBox="0 0 48 25" aria-hidden="true">
      {bike ? (
        <>
          <circle cx="10" cy="17" r="6" />
          <circle cx="38" cy="17" r="6" />
          <path d="M10 17L20 7L28 17H10M28 17L33 4H28M33 4L38 17M16 6H23" />
        </>
      ) : (
        <>
          <path d="M4 18V12L9 10L15 4H30L37 10L44 12V18H39M9 18H33M12 10H34M20 4V10" />
          <circle cx="10" cy="18" r="4" />
          <circle cx="37" cy="18" r="4" />
        </>
      )}
    </svg>
  );
}
export default function App() {
  const [classic, setClassic] = useState(false),
    [intro, setIntro] = useState(true),
    [menu, setMenu] = useState<"map" | "settings" | null>(null),
    [stop, setStop] = useState<number | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle>(() =>
    saved("kg.vehicle.v1", ["car", "bike"], "car"),
  );
  const [mood, setMood] = useState<Mood>(() =>
    saved("kg.mood.v1", ["sunset", "night", "day"], "sunset"),
  );
  const [mode, setMode] = useState<DriveMode>("free"),
    [cameraMode, setCameraMode] = useState<CameraMode>("orbit"),
    [low, setLow] = useState(() => matchMedia("(max-width: 700px)").matches);
  const [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [flat, setFlat] = useState(false),
    [manualPause, setManualPause] = useState(false);
  const [visited, setVisited] = useState<number[]>([]),
    [sound, setSound] = useState(false);
  const audio = useRef<{
    context: AudioContext;
    osc: OscillatorNode;
    gain: GainNode;
  } | null>(null);
  const paused =
    intro || classic || menu !== null || stop !== null || manualPause;
  const visit = useCallback((i: number) => {
    setStop(i);
    setVisited((v) => (v.includes(i) ? v : [...v, i]));
  }, []);
  const tourEnd = useCallback(() => {
    setMode("free");
  }, []);
  const game = useDriving({
    vehicle,
    mode,
    paused,
    onVisit: visit,
    onTourEnd: tourEnd,
  });
  const panel = useRef<HTMLDialogElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    worldFocus = useRef<HTMLDivElement>(null);
  const open = menu !== null || stop !== null;
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement;
      panel.current?.showModal();
    } else {
      panel.current?.close();
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    }
  }, [open]);
  useEffect(() => {
    try {
      localStorage.setItem("kg.vehicle.v1", vehicle);
      localStorage.setItem("kg.mood.v1", mood);
    } catch {
      /* preferences are optional */
    }
  }, [vehicle, mood]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const interact = () => {
    if (game.near >= 0) visit(game.near);
  };
  useKeys(game.controls, !paused && mode === "free", interact, game.reset, () =>
    setMenu("map"),
  );
  function closePanel() {
    setMenu(null);
    setStop(null);
  }
  function start(tour = false) {
    setIntro(false);
    setManualPause(false);
    setMode(tour ? "tour" : "free");
    if (tour) game.startTour();
    worldFocus.current?.focus();
  }
  function toggleSound() {
    if (!audio.current) {
      try {
        const context = new AudioContext(),
          osc = context.createOscillator(),
          gain = context.createGain(),
          filter = context.createBiquadFilter();
        osc.type = "sawtooth";
        osc.frequency.value = 45;
        filter.type = "lowpass";
        filter.frequency.value = 240;
        gain.gain.value = 0;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        osc.start();
        audio.current = { context, osc, gain };
      } catch {
        return;
      }
    }
    void audio.current.context.resume();
    setSound((v) => !v);
  }
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const a = audio.current;
      if (a) {
        const speed = Math.hypot(game.state.current.vx, game.state.current.vz);
        a.osc.frequency.setTargetAtTime(
          (vehicle === "bike" ? 65 : 40) + speed * 4,
          a.context.currentTime,
          0.1,
        );
        a.gain.gain.setTargetAtTime(
          sound && !paused && !document.hidden ? 0.025 : 0,
          a.context.currentTime,
          0.12,
        );
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [sound, paused, vehicle, game.state]);
  useEffect(
    () => () => {
      void audio.current?.context.close();
    },
    [],
  );
  const unavailable = useCallback(() => setFlat(true), []);
  const [showGuide, setShowGuide] = useState(false);
  const speed = paused
    ? 0
    : Math.round(Math.hypot(game.snapshot.vx, game.snapshot.vz) * 3.6);
  if (classic)
    return (
      <>
        <button className="back-to-track" onClick={() => setClassic(false)}>
          ← Back to Motor Park
        </button>
        <Suspense fallback={<p>Loading profile…</p>}>
          <Profile disableScene />
        </Suspense>
      </>
    );
  return (
    <div className={`motor-park theme-${mood}`}>
      <a
        className="park-skip"
        href="#park-navigation"
        onClick={() => setMenu("map")}
      >
        Skip driving · explore profile
      </a>
      <div
        className="world-stage"
        ref={worldFocus}
        tabIndex={-1}
        aria-label="Driving area. WASD or arrows to drive, space to brake, shift to boost, E to interact, M for map."
      >
        {flat ? (
          <div className="flat-world">
            <ParkMap
              state={game.snapshot}
              mood={mood}
              vehicle={vehicle}
              large
            />
          </div>
        ) : (
          <SceneBoundary onUnavailable={unavailable}>
            <Suspense
              fallback={
                <div className="park-loading">
                  <span />
                  Building your world…
                </div>
              }
            >
              <Circuit
                state={game.state}
                vehicle={vehicle}
                mood={mood}
                near={game.near}
                cameraMode={cameraMode}
                reduced={reduced}
                low={low}
                intro={intro}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="park-edge" />
      <header className="park-header">
        <button
          className="park-brand"
          onClick={() => setIntro(true)}
          aria-label="Welcome to Karthik's Motor Park"
        >
          <b>
            KG<span>↗</span>
          </b>
          <span>
            KARTHIK GUDURI<small>THE PERSONAL MOTOR PARK</small>
          </span>
        </button>
        <div className="header-actions">
          <div className="ride-switch" aria-label="Choose your vehicle">
            {(["car", "bike"] as Vehicle[]).map((v) => (
              <button
                key={v}
                aria-label={
                  v === "car" ? "Drive sports car" : "Ride motorcycle"
                }
                aria-pressed={vehicle === v}
                onClick={() => setVehicle(v)}
              >
                <RideIcon bike={v === "bike"} />
              </button>
            ))}
          </div>
          <button
            className="mood-button"
            onClick={() =>
              setMood(
                mood === "sunset"
                  ? "night"
                  : mood === "night"
                    ? "day"
                    : "sunset",
              )
            }
            aria-label={`Atmosphere: ${mood}. Change atmosphere.`}
          >
            <span>
              {mood === "sunset" ? "◒" : mood === "night" ? "☾" : "☀"}
            </span>
            <span>{mood === "night" ? "Neon night" : mood}</span>
          </button>
          <button
            onClick={() => setShowGuide((value) => !value)}
            className="settings-button"
            aria-label="Show driving controls"
            aria-expanded={showGuide}
          >
            ?
          </button>
          <button
            onClick={() => setMenu("settings")}
            className="settings-button"
            aria-label="Open settings"
          >
            ⚙
          </button>
          <button className="quick-profile" onClick={() => setClassic(true)}>
            Quick profile ↗
          </button>
        </div>
      </header>
      {showGuide && <aside className="driving-guide" aria-label="Driving controls"><strong>Explore your way</strong><p>Use WASD or arrow keys to drive, E to explore a nearby destination, and M for the map. On touch devices use the on-screen controls. You can always select Quick profile for a standard accessible view.</p><button onClick={() => setShowGuide(false)}>Close guide</button></aside>}
      <div className="park-status">
        <span className="live-dot" />
        {flat
          ? "2D driving · 3D unavailable on this device"
          : mode === "tour"
            ? "GUIDED TOUR"
            : manualPause
              ? "PAUSED"
              : "AN OPEN WORLD. YOUR OWN PACE."}
      </div>
      {!intro && (
        <aside className="exploration">
          <span>{visited.length} / 5</span> places discovered
          <div>
            {destinations.map((d, i) => (
              <i key={d.id} className={visited.includes(i) ? "found" : ""} />
            ))}
          </div>
        </aside>
      )}
      {intro ? (
        <section className="welcome-card">
          <p className="park-eyebrow">
            ARCHITECT BY PROFESSION. EXPLORER BY NATURE.
          </p>
          <h1>
            Good things happen
            <br />
            off the beaten track<span>.</span>
          </h1>
          <p>
            I’m Karthik. Take a car or bike through my world of
            <br className="desktop-break" /> cloud platforms, creative ideas,
            and AI.
          </p>
          <div className="welcome-actions">
            <button className="park-primary" onClick={() => start()}>
              Let’s drive <span>↗</span>
            </button>
            <button onClick={() => start(true)}>Show me around →</button>
            <button onClick={() => { setIntro(false); setMenu("map"); }}>Explore destinations without driving ↗</button>
          </div>
          <div className="welcome-controls">
            <kbd>W A S D</kbd>
            <span>or arrow keys to explore</span>
            <span className="touch-welcome">Touch controls included</span>
          </div>
        </section>
      ) : (
        <>
          <button
            className="minimap-button"
            onClick={() => setMenu("map")}
            aria-label="Open park map and destinations"
          >
            <ParkMap state={game.snapshot} mood={mood} vehicle={vehicle} />
            <span>
              THE PARK MAP <kbd>M</kbd>
            </span>
          </button>
          <section className="drive-prompt" aria-live="polite">
            {game.near >= 0 ? (
              <button onClick={interact}>
                <span className="prompt-index">
                  {destinations[game.near].number}
                </span>
                <span>
                  <small>YOU’VE ARRIVED AT</small>
                  {destinations[game.near].name}
                </span>
                <kbd>E ↗</kbd>
              </button>
            ) : (
              <p>
                {mode === "tour"
                  ? "Enjoy the ride. Your next stop is ahead."
                  : "Follow your curiosity. Drive up to a glowing circle."}
              </p>
            )}
          </section>
          <aside className="speedometer">
            <strong>
              {speed.toString().padStart(2, "0")}
              <small>KM/H</small>
            </strong>
            <div>
              {vehicle === "car" ? "GT / SPORTS CAR" : "RR / SUPERBIKE"}
            </div>
            <span>
              {game.snapshot.lapStart === null
                ? "Cross the start line to time a lap"
                : `LAP ${game.snapshot.lapTime.toFixed(1)}s`}
            </span>
            {game.snapshot.bestLap !== null && (
              <span>BEST {game.snapshot.bestLap.toFixed(1)}s</span>
            )}
          </aside>
          <div className="drive-toolbar">
            <button
              onClick={() => {
                setMode("free");
                setManualPause((v) => !v);
              }}
            >
              {manualPause
                ? "Resume ▷"
                : mode === "tour"
                  ? "Take the wheel"
                  : "Pause Ⅱ"}
            </button>
            <button onClick={game.reset}>Unstuck ↺</button>
            <button
              onClick={() =>
                setCameraMode((v) => (v === "orbit" ? "chase" : "orbit"))
              }
            >
              {cameraMode === "orbit" ? "Chase camera" : "Overview camera"}
            </button>
            <button onClick={toggleSound} aria-pressed={sound}>
              {sound ? "Sound on ♪" : "Sound off"}
            </button>
          </div>
          {!paused && mode === "free" && (
            <div className="touch-controls" aria-label="Touch driving controls">
              {[
                ["left", "←"],
                ["right", "→"],
                ["reverse", "Reverse"],
                ["brake", "Brake"],
                ["boost", "Boost"],
                ["go", "Go ↑"],
              ].map(([action, label]) => (
                <button
                  key={action}
                  className={`touch-${action}`}
                  aria-label={
                    action === "left"
                      ? "Steer left"
                      : action === "right"
                        ? "Steer right"
                        : label
                  }
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    controlValue(action, game.controls.current, true);
                  }}
                  onPointerUp={() =>
                    controlValue(action, game.controls.current, false)
                  }
                  onPointerCancel={() =>
                    controlValue(action, game.controls.current, false)
                  }
                  onLostPointerCapture={() =>
                    controlValue(action, game.controls.current, false)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      controlValue(action, game.controls.current, true);
                    }
                  }}
                  onKeyUp={() =>
                    controlValue(action, game.controls.current, false)
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="desktop-drive-help">
            <kbd>WASD</kbd> drive <kbd>SPACE</kbd> brake <kbd>SHIFT</kbd> boost
          </div>
        </>
      )}
      <footer className="park-footer">
        <span>AEM CLOUD ARCHITECT / AI PRODUCT BUILDER</span>
        <span>BUILT FOR THE JOURNEY.</span>
      </footer>
      <dialog
        ref={panel}
        className="park-panel"
        onCancel={closePanel}
        onClose={closePanel}
        aria-label={
          stop !== null
            ? destinations[stop].name
            : menu === "map"
              ? "Park map and destinations"
              : "Driving settings"
        }
      >
        <button
          className="panel-close"
          onClick={closePanel}
          autoFocus
          aria-label="Close panel"
        >
          ×
        </button>
        {stop !== null ? (
          <DestinationContent index={stop} />
        ) : menu === "map" ? (
          <>
            <p className="park-eyebrow">FIND YOUR NEXT TURN</p>
            <h2>Your world to explore.</h2>
            <ParkMap
              state={game.snapshot}
              mood={mood}
              vehicle={vehicle}
              large
            />
            <nav
              id="park-navigation"
              className="map-destinations"
              aria-label="Portfolio destinations"
            >
              {destinations.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setMenu(null);
                    visit(i);
                  }}
                >
                  <span>{d.number}</span>
                  <strong>{d.name}</strong>
                  <span>{visited.includes(i) ? "✓" : "↗"}</span>
                </button>
              ))}
            </nav>
            <button
              className="panel-cta"
              onClick={() => {
                closePanel();
                start(true);
              }}
            >
              Take a guided tour →
            </button>
          </>
        ) : menu === "settings" ? (
          <>
            <p className="park-eyebrow">MAKE YOURSELF AT HOME</p>
            <h2>Your ride. Your mood.</h2>
            <fieldset>
              <legend>Vehicle</legend>
              {(["car", "bike"] as Vehicle[]).map((v) => (
                <button
                  key={v}
                  aria-pressed={vehicle === v}
                  onClick={() => setVehicle(v)}
                >
                  {v === "car" ? "Sports car" : "Motorcycle"}
                </button>
              ))}
            </fieldset>
            <fieldset>
              <legend>Atmosphere</legend>
              {(["day", "sunset", "night"] as Mood[]).map((m) => (
                <button
                  key={m}
                  aria-pressed={mood === m}
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </fieldset>
            <label className="setting-row">
              <span>
                Reduced camera motion<small>A steady overhead view</small>
              </span>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />
            </label>
            <label className="setting-row">
              <span>
                Performance mode
                <small>Fewer shadows and lower pixel density</small>
              </span>
              <input
                type="checkbox"
                checked={low}
                onChange={(e) => setLow(e.target.checked)}
              />
            </label>
            <button onClick={toggleSound} aria-pressed={sound}>
              {sound ? "Mute engine sound" : "Enable engine sound"}
            </button>
            <h3>How to explore</h3>
            <p>
              WASD or arrows: steer, accelerate and reverse. Space: brake and
              drift. Shift: boost. E: visit a nearby destination. M: map. R:
              respawn.
            </p>
            <p>
              Drive the track through all four checkpoints to complete a timed
              lap. Hit the ramp near the center to catch some air.
            </p>
            <button
              onClick={() => {
                closePanel();
                setClassic(true);
              }}
            >
              Read Quick Profile ↗
            </button>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
