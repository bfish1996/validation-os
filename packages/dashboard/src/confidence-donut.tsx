/**
 * A confidence donut gauge (DEV-5882 redesign) — an SVG ring that fills from
 * -90° proportional to the value (0–100, 50 = neutral). Color-toned by value
 * (good ≥67, warn ≥33, crit <33). The center shows the number. Used on the
 * experiment list rows (56px) + the experiment detail header (80px).
 */
export function ConfidenceDonut({
  value,
  size = 56,
}: {
  value: number;
  size?: number;
}) {
  const r = size / 2 - 5;
  const cx = size / 2;
  const cy = size / 2;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const color = value >= 67 ? "var(--vos-good)" : value >= 33 ? "var(--vos-warn)" : "var(--vos-crit)";
  const endAngle = -Math.PI / 2 + pct * 2 * Math.PI;
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;
  return (
    <div className="vos-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--vos-surface-2)"
          strokeWidth={4}
        />
        {value > 0 ? (
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={color}
            opacity={0.25}
            stroke={color}
            strokeWidth={1.5}
          />
        ) : null}
      </svg>
      <span className="vos-donut-num vos-num" style={{ fontSize: size > 60 ? 18 : 14 }}>
        {Math.round(value)}
      </span>
    </div>
  );
}