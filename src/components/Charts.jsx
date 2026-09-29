import { useId, useState } from "react";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function buildPath(points, smooth = true) {
  if (!points.length) return "";
  if (!smooth || points.length < 3) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

function niceMax(v) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
}

export function LineChart({
  labels = [],
  series = [],
  height = 220,
  unit = "",
  showArea = true,
  showDots = true,
  yMin,
  yMax,
  band,
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const padL = 42;
  const padR = 14;
  const padT = 16;
  const padB = 30;

  const all = series.flatMap((s) => s.data);
  const rawMax = yMax ?? niceMax(Math.max(...all, band?.max ?? 0) * 1.08);
  const rawMin = yMin ?? Math.min(...all, band?.min ?? Infinity) * 0.95;
  const top = Math.max(rawMax, 0);
  const bottom = band ? rawMin : Math.min(rawMin, 0);
  const span = top - bottom || 1;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xAt = (i) => padL + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
  const yAt = (v) => padT + plotH - ((v - bottom) / span) * plotH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => bottom + span * t);

  const step = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div className="chart-wrap">
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Line chart, ${series.map((s) => s.name).join(" and ")}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.name} id={`${gid}-${s.tone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--c-${s.tone})`} stopOpacity="0.28" />
              <stop offset="100%" stopColor={`var(--c-${s.tone})`} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yAt(t)}
              y2={yAt(t)}
              className="grid-line"
            />
            <text x={padL - 8} y={yAt(t) + 4} className="axis-text" textAnchor="end">
              {Math.round(t)}
              {unit}
            </text>
          </g>
        ))}

        {band && (
          <rect
            x={padL}
            y={yAt(band.max)}
            width={plotW}
            height={Math.max(0, yAt(band.min) - yAt(band.max))}
            className="chart-band"
          />
        )}

        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text key={l + i} x={xAt(i)} y={H - 9} className="axis-text" textAnchor="middle">
              {l}
            </text>
          ) : null
        )}

        {hover !== null && (
          <line x1={xAt(hover)} x2={xAt(hover)} y1={padT} y2={padT + plotH} className="hover-line" />
        )}

        {series.map((s) => {
          const pts = s.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
          const d = buildPath(pts);
          return (
            <g key={s.name}>
              {showArea && (
                <path
                  d={`${d} L${pts[pts.length - 1].x.toFixed(2)},${(padT + plotH).toFixed(2)} L${pts[0].x.toFixed(2)},${(padT + plotH).toFixed(2)} Z`}
                  fill={`url(#${gid}-${s.tone})`}
                />
              )}
              <path
                d={d}
                fill="none"
                stroke={`var(--c-${s.tone})`}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {showDots &&
                pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={hover === i ? 5.5 : 3.2}
                    className={cx("chart-dot", hover === i && "big")}
                    style={{ fill: `var(--c-${s.tone})` }}
                  />
                ))}
            </g>
          );
        })}

        {labels.map((l, i) => (
          <rect
            key={`hit-${i}`}
            x={xAt(i) - plotW / (labels.length * 2)}
            y={padT}
            width={plotW / labels.length}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null && (
        <div className="chart-tip">
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: `var(--c-${s.tone})` }} />
              {s.name}: {s.data[hover]}
              {unit}
            </span>
          ))}
        </div>
      )}

      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: `var(--c-${s.tone})` }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarChart({
  labels = [],
  series = [],
  height = 200,
  unit = "",
  max,
  showValues = false,
  target,
}) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const padL = 42;
  const padR = 14;
  const padT = 18;
  const padB = 30;

  const all = series.flatMap((s) => s.data);
  const top = max ?? niceMax(Math.max(...all, target ?? 0) * 1.1);
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / labels.length;
  const barW = Math.min(38, (slot * 0.62) / Math.max(series.length, 1));

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => top * t);

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={padT + plotH - (t / top) * plotH} y2={padT + plotH - (t / top) * plotH} className="grid-line" />
            <text x={padL - 8} y={padT + plotH - (t / top) * plotH + 4} className="axis-text" textAnchor="end">
              {Math.round(t)}
              {unit}
            </text>
          </g>
        ))}

        {target && (
          <line
            x1={padL}
            x2={W - padR}
            y1={padT + plotH - (target / top) * plotH}
            y2={padT + plotH - (target / top) * plotH}
            className="target-line"
          />
        )}

        {labels.map((l, i) => (
          <g
            key={l + i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <rect
              x={xAt(i, slot, padL, series.length, barW)}
              y={padT}
              width={barW * series.length + (series.length - 1) * 3}
              height={plotH}
              className={cx("bar-hit", hover === i && "on")}
            />
            {series.map((s, si) => {
              const v = s.data[i];
              const h = (v / top) * plotH;
              return (
                <rect
                  key={s.name}
                  x={xAt(i, slot, padL, series.length, barW) + si * (barW + 3)}
                  y={padT + plotH - h}
                  width={barW}
                  height={Math.max(2, h)}
                  rx="4"
                  fill={`var(--c-${s.tone})`}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  className="bar"
                />
              );
            })}
            {showValues && series.length === 1 && (
              <text
                x={xAt(i, slot, padL, series.length, barW) + barW / 2}
                y={padT + plotH - (series[0].data[i] / top) * plotH - 6}
                className="axis-text strong"
                textAnchor="middle"
              >
                {series[0].data[i]}
              </text>
            )}
            <text x={xAt(i, slot, padL, series.length, barW) + (barW * series.length) / 2} y={H - 9} className="axis-text" textAnchor="middle">
              {l}
            </text>
          </g>
        ))}
      </svg>

      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: `var(--c-${s.tone})` }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function xAt(i, slot, padL, count, barW) {
  const groupW = barW * count + (count - 1) * 3;
  return padL + i * slot + (slot - groupW) / 2;
}

export function DonutChart({
  segments = [],
  size = 190,
  thickness = 26,
  centerLabel,
  centerValue,
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  const arcs = segments.reduce((acc, s) => {
    const start = acc.offset;
    const len = (s.value / total) * c;
    acc.items.push({ ...s, len, start });
    acc.offset = start + len;
    return acc;
  }, { items: [], offset: 0 }).items;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} className="donut-track" strokeWidth={thickness} />
          {arcs.map((s) => (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              className="donut-seg"
              strokeWidth={thickness}
              stroke={s.color}
              strokeDasharray={`${s.len} ${c - s.len}`}
              strokeDashoffset={-s.start}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
      <div className="donut-center">
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

export function RingGauge({
  value,
  max = 100,
  size = 168,
  thickness = 14,
  tone = "primary",
  label,
  sublabel,
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} className="donut-track" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`var(--c-${tone})`}
            strokeWidth={thickness}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            strokeLinecap="round"
            className="ring-arc"
          />
        </g>
      </svg>
      <div className="ring-center">
        <strong>
          {value}
          <small>%</small>
        </strong>
        {label && <span>{label}</span>}
        {sublabel && <em>{sublabel}</em>}
      </div>
    </div>
  );
}

export function Sparkline({ data = [], tone = "primary", width = 96, height = 32 }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (width - 4) + 2,
    y: height - 3 - ((v - min) / span) * (height - 6),
  }));
  return (
    <svg width={width} height={height} className="spark" aria-hidden="true">
      <path
        d={buildPath(pts)}
        fill="none"
        stroke={`var(--c-${tone})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RangeBar({ value, min, max, tone = "primary", markers = [] }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-bar">
      <div className="range-track">
        <div
          className={cx("range-fill", `tone-${tone}`)}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
        {markers.map((m) => (
          <span key={m.label} className="range-marker" style={{ left: `${m.pct}%` }} title={m.label} />
        ))}
      </div>
      <div className="range-scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function ActivityHeatmap({ weeks = 12, seed = 3 }) {
  const cells = [];
  let s = seed;
  for (let i = 0; i < weeks * 7; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const v = s / 233280;
    const level = v > 0.86 ? 4 : v > 0.68 ? 3 : v > 0.46 ? 2 : v > 0.24 ? 1 : 0;
    cells.push(level);
  }
  return (
    <div className="heatmap-wrap">
      <div className="heatmap" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {cells.map((l, i) => (
          <span key={i} className={cx("hm-cell", `lv${l}`)} title={`Day ${i + 1}`} />
        ))}
      </div>
      <div className="hm-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={cx("hm-cell", `lv${l}`)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function MiniBars({ data = [], tone = "primary", height = 46 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mini-bars" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="mb-col" title={`${d.label}: ${d.value}`}>
          <div
            className={cx("mb-bar", "tone-" + tone)}
            style={{ height: `${Math.max(6, (d.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
