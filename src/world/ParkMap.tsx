import { destinations, palettes } from "./config";
import type { Mood, Vehicle } from "./config";
import type { State } from "./physics";
export default function ParkMap({
  state,
  mood,
  vehicle,
  large = false,
}: {
  state: State;
  mood: Mood;
  vehicle: Vehicle;
  large?: boolean;
}) {
  const p = palettes[mood];
  return (
    <svg
      viewBox="-101 -77 202 154"
      role="img"
      aria-label={`Park map. Vehicle at ${Math.round(state.x)}, ${Math.round(state.z)}. Orange arrow shows your position.`}
      className={large ? "park-map large-map" : "park-map"}
    >
      <rect x="-101" y="-77" width="202" height="154" rx="5" fill={p.water} />
      <rect x="-97" y="-73" width="194" height="146" rx="10" fill={p.ground} />
      <ellipse rx="68" ry="46" fill="none" stroke={p.road} strokeWidth="12" />
      <path
        d="M-57 21H57 M-30 28V-35 M-45-25H46 M35-34V30 M0 21V59"
        stroke={p.road}
        strokeWidth="13"
        fill="none"
      />
      <ellipse
        rx="68"
        ry="46"
        fill="none"
        stroke="#eadab5"
        strokeWidth=".3"
        strokeDasharray="2 3"
      />
      {Array.from({ length: 24 }, (_, i) => {
        const a = i * 2.399,
          x = Math.cos(a) * 85,
          z = Math.sin(a) * 62;
        return (
          <g key={i}>
            <ellipse cx={x + 1} cy={z + 1} rx="2.9" ry="2" fill="#0002" />
            <circle cx={x} cy={z} r="2.1" fill={p.grass} />
          </g>
        );
      })}
      <rect x="-10" y="-7" width="16" height="14" rx="2" fill={p.grass} />
      <text
        x="-2"
        y="2"
        textAnchor="middle"
        fontSize="5"
        fill="#f3dfb7"
        fontWeight="900"
      >
        KG
      </text>
      {destinations.map((d) => (
        <g key={d.id}>
          <rect
            x={d.building[0] - 8}
            y={d.building[1] - 5.5}
            width="16"
            height="11"
            rx="1"
            fill="#344c5e"
          />
          <rect
            x={d.building[0] - 8}
            y={d.building[1] - 7}
            width="16"
            height="11"
            rx="1"
            fill={d.color}
          />
          <text
            x={d.building[0]}
            y={d.building[1]}
            fontSize="4"
            textAnchor="middle"
            fill="#30434b"
            fontWeight="700"
          >
            {d.number}
          </text>
          <circle
            cx={d.x}
            cy={d.z}
            r="5"
            fill="none"
            stroke={d.color}
            strokeWidth=".7"
          />
          {large && (
            <text
              x={d.x}
              y={d.z + 9}
              textAnchor="middle"
              fontSize="3.3"
              fill={mood === "night" ? "#fff" : "#273a40"}
              fontWeight="700"
            >
              {d.name}
            </text>
          )}
        </g>
      ))}
      <path d="M13.5 5H20.5V-4H13.5Z" fill="#ba9875" />
      {state.cones.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.z} r=".7" fill="#e66d38" />
      ))}
      <g
        transform={`translate(${state.x} ${state.z}) rotate(${(-state.heading * 180) / Math.PI})`}
      >
        <circle r="3.3" fill="#fff" opacity=".2" />
        <rect
          x={vehicle === "bike" ? -0.65 : -1.2}
          y="-2"
          width={vehicle === "bike" ? 1.3 : 2.4}
          height="4.2"
          rx=".6"
          fill="#ef6d3f"
          stroke="#fff2d6"
          strokeWidth=".3"
        />
        <path d="M0 4L-1.7 1.5H1.7Z" fill="#fff4d4" />
      </g>
    </svg>
  );
}
