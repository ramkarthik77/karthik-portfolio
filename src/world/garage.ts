// Street-racing customisation: paint, underglow and livery. Chosen in Settings
// and remembered between visits.

export const paints = {
  inferno: { name: "Inferno orange", body: "#ff5a1f", accent: "#14181c", caliper: "#f2f2f2" },
  midnight: { name: "Midnight blue", body: "#1a3bd6", accent: "#2ee6ff", caliper: "#ff3b3b" },
  toxic: { name: "Toxic green", body: "#6fe02a", accent: "#101316", caliper: "#ffd400" },
  pearl: { name: "Pearl white", body: "#eceef1", accent: "#ff2d55", caliper: "#ff2d55" },
  stealth: { name: "Stealth black", body: "#16191d", accent: "#ff7a1a", caliper: "#ff7a1a" },
} as const;
export type Paint = keyof typeof paints;

export const glows = {
  cyan: { name: "Cyan", color: "#19e3ff" },
  magenta: { name: "Magenta", color: "#ff2bd6" },
  lime: { name: "Lime", color: "#7dff3a" },
  amber: { name: "Amber", color: "#ff8a1f" },
  off: { name: "Off", color: "" },
} as const;
export type Glow = keyof typeof glows;

export type Garage = { paint: Paint; glow: Glow; livery: boolean };
export const defaultGarage: Garage = { paint: "inferno", glow: "cyan", livery: true };

const KEY = "kg.garage.v1";
export function loadGarage(): Garage {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Garage> | null;
    if (!raw) return defaultGarage;
    return {
      paint: raw.paint && raw.paint in paints ? raw.paint : defaultGarage.paint,
      glow: raw.glow && raw.glow in glows ? raw.glow : defaultGarage.glow,
      livery: typeof raw.livery === "boolean" ? raw.livery : defaultGarage.livery,
    };
  } catch {
    return defaultGarage;
  }
}
export function saveGarage(garage: Garage) {
  try {
    localStorage.setItem(KEY, JSON.stringify(garage));
  } catch {
    /* preferences are optional */
  }
}
