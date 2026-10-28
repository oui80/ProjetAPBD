import type { PointerEvent } from "react";
import { downsampleIndices } from "./analysis-calculations";
import type { ActivitySample } from "./activity-types";

type Props = {
  title: string;
  unit: string;
  color: string;
  samples: ActivitySample[];
  value: (sample: ActivitySample) => number | null;
  xMode: "time" | "distance";
  activeIndex: number | null;
  onActiveIndex: (index: number | null) => void;
};

export function TimeSeriesChart({
  title,
  unit,
  color,
  samples,
  value,
  xMode,
  activeIndex,
  onActiveIndex,
}: Props) {
  const points = downsampleIndices(samples.length).flatMap((index) => {
    const sample = samples[index]!;
    const y = value(sample);
    const x = xValue(sample, samples[0], xMode);
    return y === null || x === null ? [] : [{ index, x, y }];
  });
  if (points.length < 2) {
    return (
      <article className="analysis-tile analysis-tile--empty">
        <h3>{title}</h3>
        <p>Non calculable — données absentes.</p>
      </article>
    );
  }

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const path = points.map((point, index) => {
    const x = scale(point.x, minX, maxX, 12, 588);
    const y = scale(point.y, minY, maxY, 142, 12);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const active = activeIndex === null
    ? null
    : points.reduce((closest, point) =>
      Math.abs(point.index - activeIndex) < Math.abs(closest.index - activeIndex) ? point : closest,
    points[0]!);

  function select(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const targetX = minX + ratio * (maxX - minX);
    const nearest = points.reduce((closest, point) =>
      Math.abs(point.x - targetX) < Math.abs(closest.x - targetX) ? point : closest,
    points[0]!);
    onActiveIndex(nearest.index);
  }

  return (
    <article className="analysis-tile chart-tile">
      <div className="analysis-tile__heading">
        <h3>{title}</h3>
        <span>{active ? `${format(active.y)} ${unit}` : `${format(maxY)} ${unit} max`}</span>
      </div>
      <svg
        className="series-chart"
        viewBox="0 0 600 155"
        role="img"
        aria-label={`${title}, série temporelle interactive`}
        onPointerMove={select}
        onPointerDown={select}
        onPointerLeave={() => onActiveIndex(null)}
      >
        <line x1="12" y1="142" x2="588" y2="142" className="series-chart__axis" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {active && (
          <>
            <line
              x1={scale(active.x, minX, maxX, 12, 588)}
              y1="8"
              x2={scale(active.x, minX, maxX, 12, 588)}
              y2="142"
              className="series-chart__cursor"
            />
            <circle
              cx={scale(active.x, minX, maxX, 12, 588)}
              cy={scale(active.y, minY, maxY, 142, 12)}
              r="4"
              fill={color}
            />
          </>
        )}
      </svg>
    </article>
  );
}

function xValue(
  sample: ActivitySample,
  first: ActivitySample | undefined,
  mode: "time" | "distance",
): number | null {
  if (mode === "distance") return sample.distanceMeters;
  if (!sample.recordedAt || !first?.recordedAt) return null;
  return (Date.parse(sample.recordedAt) - Date.parse(first.recordedAt)) / 1000;
}

function scale(value: number, min: number, max: number, start: number, end: number): number {
  return min === max ? (start + end) / 2 : start + ((value - min) / (max - min)) * (end - start);
}

function format(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
}
