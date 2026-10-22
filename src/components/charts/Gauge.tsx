import { useVizTokens } from './tokens';

export interface GaugeProps {
  value: number | null; // e.g. 60 or 0.60
  label: string;
  size?: number;
}

/**
 * Semicircle gauge matching the /journal design system.
 * Adapts seamlessly to both light (ivory/slate) and dark modes.
 */
export function Gauge({ value, label, size = 96 }: GaugeProps) {
  const t = useVizTokens();

  // Normalize ratio to 0..1
  const ratio =
    value === null
      ? 0
      : value > 1
      ? Math.min(Math.max(value / 100, 0), 1)
      : Math.min(Math.max(value, 0), 1);

  const radius = size / 2 - 6;
  const circumference = Math.PI * radius;

  return (
    <div
      className="journal-gauge flex min-w-0 flex-col items-center"
      role="img"
      aria-label={`${label}: ${value === null ? "no data" : `${(ratio * 100).toFixed(1)}%`}`}
    >
      <svg
        width={size}
        height={size / 2 + 8}
        viewBox={`0 0 ${size} ${size / 2 + 8}`}
        className="overflow-visible"
      >
        {/* Background track */}
        <path
          d={`M 6 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 2}`}
          fill="none"
          stroke={t.gridline}
          strokeWidth={7}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d={`M 6 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 2}`}
          fill="none"
          stroke={t.brand}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="-mt-5 text-center">
        <div className="text-base sm:text-lg font-bold tabular-nums text-foreground tracking-tight">
          {value === null ? "–" : `${Math.round(ratio * 100)}%`}
        </div>
      </div>
    </div>
  );
}
