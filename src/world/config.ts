export type Vehicle = "car" | "bike";
export type Mood = "sunset" | "night" | "day";
export type DriveMode = "free" | "tour";
export type CameraMode = "orbit" | "chase";
export const destinations = [
  {
    id: "garage",
    name: "Welcome garage",
    label: "START YOUR ENGINES",
    x: -30,
    z: 20,
    color: "#ff8a50",
    number: "01",
    building: [-42, 8] as const,
  },
  {
    id: "career",
    name: "Career paddock",
    label: "THE JOURNEY SO FAR",
    x: -38,
    z: -25,
    color: "#f4c55b",
    number: "02",
    building: [-42, -37] as const,
  },
  {
    id: "lab",
    name: "Innovation lab",
    label: "IDEAS INTO REALITY",
    x: 25,
    z: -27,
    color: "#8acac0",
    number: "03",
    building: [28, -39] as const,
  },
  {
    id: "gallery",
    name: "Milestone gallery",
    label: "BUILT TO GO FURTHER",
    x: 43,
    z: 18,
    color: "#b8a3e2",
    number: "04",
    building: [53, 6] as const,
  },
  {
    id: "contact",
    name: "Contact clubhouse",
    label: "LET’S BUILD WHAT’S NEXT",
    x: 0,
    z: 48,
    color: "#f2b7a1",
    number: "05",
    building: [1, 61] as const,
  },
] as const;
export type Destination = (typeof destinations)[number];
export const spawn = { x: -24, z: 24, heading: Math.PI / 2 };
export const colliders = [
  ...destinations.map((d) => ({
    x: d.building[0],
    z: d.building[1],
    hx: 8,
    hz: 5.5,
  })),
  { x: -2, z: 0, hx: 8, hz: 7 },
];
export const coneStarts = [
  [-12, 18],
  [-6, 18],
  [0, 18],
  [6, 18],
  [12, 18],
  [60, -12],
  [61, -6],
  [61, 0],
  [61, 6],
  [-58, -5],
  [-58, 1],
  [-58, 7],
] as const;
export const palettes = {
  sunset: {
    sky: "#bda99a",
    ground: "#d1b589",
    grass: "#788475",
    road: "#63646a",
    water: "#789d9d",
    sun: "#ffe0a9",
    accent: "#ff8a50",
    building: "#ece1c8",
  },
  day: {
    sky: "#b8d5d8",
    ground: "#ddd3ad",
    grass: "#83a388",
    road: "#667477",
    water: "#85b9bf",
    sun: "#fff5df",
    accent: "#f5a156",
    building: "#f4eddb",
  },
  night: {
    sky: "#161f35",
    ground: "#3f4c61",
    grass: "#354c58",
    road: "#263443",
    water: "#192f48",
    sun: "#bacdf6",
    accent: "#a89bff",
    building: "#637388",
  },
} as const;
