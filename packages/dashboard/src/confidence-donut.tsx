/**
 * A confidence donut gauge (DEV-5882 redesign) — a minimal ring gauge that
 * fills from 12 o'clock clockwise, proportional to the value (0–100, 50 = neutral).
 * The stroke is deliberately thin so the gauge reads as a subtle status
 * accent, not a pie chart. A larger centered number dominates the interior.
 * Used on the experiment list rows (56px) + the experiment detail header (80px).
 */
export function ConfidenceDonut({
  value,
  size = 56,
}: {
  value: number;
  size?: number;
}) {
  // Thin stroke keeps it elegant; radius stays well inside the square.
  const stroke = size > 60 ? 4 : 3;
  const r = (size - stroke * 3) / 2;
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
          stroke="var(--vos-border)"
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
        style={{ fontSize: size > 60 ? 22 : 15 }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}