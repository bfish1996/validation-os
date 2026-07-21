/**
 * A confidence donut gauge (DEV-5882 redesign) — an SVG ring that fills from
 * 12 o'clock clockwise, proportional to the value (0–100, 50 = neutral).
 * Color-toned by value (good ≥67, warn ≥33, crit <33). The center shows the
 * number. Used on the experiment list rows (56px) + the experiment detail
 * header (80px).
 *
 * Drawn as a ring via two overlaid circles with stroke-dasharray: a muted
 * track circle and a colored arc circle whose dash length encodes the
 * fraction. The arc starts at 12 o'clock by rotating the circle -90° around
 * its center. This avoids pie-wedge path math and keeps the number visually
 * centered in the ring.
 */
export function ConfidenceDonut({
  value,
  size = 56,
}: {
  value: number;
  size?: number;
}) {
  const stroke = size > 60 ? 6 : 4;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = pct * circumference;
  const color =
    value >= 67
      ? "var(--vos-good)"
      : value >= 33
        ? "var(--vos-warn)"
        : "var(--vos-crit)";
  return (
    <div className="vos-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--vos-surface-2)"
          strokeWidth={stroke}
        />
        {value > 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : null}
      </svg>
      <span
        className="vos-donut-num vos-num"
        style={{ fontSize: size > 60 ? 20 : 14 }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}