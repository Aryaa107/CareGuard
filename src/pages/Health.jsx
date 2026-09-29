import { useMemo, useState } from "react";
import {
  Activity,
  Droplets,
  HeartPulse,
  Scale,
  Thermometer,
  Wind,
} from "lucide-react";
import { BarChart, LineChart, RangeBar, RingGauge } from "../components/Charts";
import { Badge, Card, Segmented } from "../components/UI";
import { useCare } from "../context/careContext";
import { bpTrend, heartTrend, vitals } from "../data/careData";

const iconMap = {
  hr: HeartPulse,
  spo2: Wind,
  temp: Thermometer,
  bp: Activity,
  glucose: Droplets,
  weight: Scale,
};

const meta = {
  hr: {
    id: "hr",
    name: "Heart Rate",
    unit: "BPM",
    range: [50, 110],
    target: [60, 100],
    value: 76,
    tone: "good",
    history: vitals.hr,
    historyLabels: vitals.labels,
    weekly: heartTrend.series[0].data,
    notes: "Resting average 71 BPM. Slight dip after evening medication.",
  },
  spo2: {
    id: "spo2",
    name: "Blood Oxygen",
    unit: "%",
    range: [92, 100],
    target: [95, 100],
    value: 98,
    tone: "good",
    history: vitals.spo2,
    historyLabels: vitals.labels,
    weekly: [97, 98, 96, 98, 99, 98, 98],
    notes: "Consistently above 96% for the last 14 days.",
  },
  temp: {
    id: "temp",
    name: "Body Temperature",
    unit: "°C",
    range: [35.5, 38],
    target: [36.1, 37.2],
    value: 36.7,
    tone: "good",
    history: vitals.temp,
    historyLabels: vitals.labels,
    weekly: [36.6, 36.8, 36.5, 36.7, 36.9, 36.6, 36.7],
    notes: "No fever pattern detected. Baseline stable.",
  },
  bp: {
    id: "bp",
    name: "Blood Pressure",
    unit: "mmHg",
    range: [80, 150],
    target: [90, 130],
    value: 118,
    tone: "good",
    history: vitals.sys,
    historyLabels: vitals.labels,
    weekly: bpTrend.series[0].data,
    notes: "Systolic averaged 118 mmHg. Within target on 6 of 7 days.",
  },
  glucose: {
    id: "glucose",
    name: "Blood Sugar",
    unit: "mg/dL",
    range: [70, 200],
    target: [80, 140],
    value: 112,
    tone: "warn",
    history: [98, 105, 168, 142, 126, 118, 112, 104, 99, 121, 158, 140, 131, 124],
    historyLabels: [
      "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p",
    ],
    weekly: [128, 134, 141, 152, 149, 138, 131],
    notes: "Post-lunch readings above 150 on 3 of 7 days. Diet review advised.",
  },
  weight: {
    id: "weight",
    name: "Weight",
    unit: "kg",
    range: [45, 70],
    target: [55, 62],
    value: 58,
    tone: "info",
    history: [58.4, 58.3, 58.2, 58.1, 58.0, 58.1, 58.0],
    historyLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    weekly: [58.4, 58.3, 58.2, 58.1, 58.0, 58.1, 58.0],
    notes: "Stable within 0.4 kg over 7 days. Target range 55 – 62 kg.",
  },
};

const order = ["hr", "spo2", "temp", "bp", "glucose", "weight"];

const readings = {
  hr: [
    { t: "6:15 AM", v: 68, n: "Woke up" },
    { t: "9:40 AM", v: 82, n: "Morning walk" },
    { t: "1:20 PM", v: 74, n: "Resting" },
    { t: "4:30 PM", v: 88, n: "Garden" },
    { t: "8:05 PM", v: 71, n: "Evening" },
  ],
  spo2: [
    { t: "6:15 AM", v: 97, n: "Woke up" },
    { t: "10:30 AM", v: 98, n: "Auto" },
    { t: "2:40 PM", v: 98, n: "Auto" },
    { t: "6:10 PM", v: 99, n: "Auto" },
    { t: "9:30 PM", v: 98, n: "Night" },
  ],
  temp: [
    { t: "6:15 AM", v: 36.4, n: "Woke up" },
    { t: "10:30 AM", v: 36.7, n: "Auto" },
    { t: "2:40 PM", v: 36.9, n: "Auto" },
    { t: "6:10 PM", v: 36.8, n: "Auto" },
    { t: "9:30 PM", v: 36.6, n: "Night" },
  ],
  bp: [
    { t: "7:05 AM", v: 124, n: "After wake" },
    { t: "11:00 AM", v: 119, n: "Mid-day" },
    { t: "3:30 PM", v: 121, n: "Afternoon" },
    { t: "7:40 PM", v: 116, n: "Evening" },
    { t: "9:40 PM", v: 113, n: "Night" },
  ],
  glucose: [
    { t: "6:40 AM", v: 98, n: "Fasting" },
    { t: "9:15 AM", v: 138, n: "Post-breakfast" },
    { t: "12:50 PM", v: 168, n: "Post-lunch ⚠" },
    { t: "4:20 PM", v: 142, n: "Afternoon" },
    { t: "8:20 PM", v: 118, n: "Pre-dinner" },
  ],
  weight: [
    { t: "6:30 AM", v: 58.4, n: "Daily weigh-in" },
    { t: "7:00 AM", v: 58.3, n: "Repeat" },
    { t: "6:30 AM", v: 58.0, n: "3-day average" },
  ],
};

export default function Health() {
  const { live } = useCare();
  const [selected, setSelected] = useState("hr");
  const [range, setRange] = useState("today");

  const current = meta[selected];
  const liveValue =
    selected === "hr" ? live.hr : selected === "spo2" ? live.spo2 : selected === "temp" ? live.temp : current.value;

  const rangeOptions = [
    { id: "today", label: "Today" },
    { id: "week", label: "7 Days" },
    { id: "month", label: "30 Days" },
  ];

  const chartData = useMemo(() => {
    if (range === "today") {
      return { labels: current.historyLabels, series: [{ name: current.name, data: current.history, tone: current.tone }] };
    }
    if (range === "week") {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        series: [{ name: current.name, data: current.weekly, tone: current.tone }],
      };
    }
    return {
      labels: ["W1", "W2", "W3", "W4", "W5"],
      series: [
        {
          name: current.name,
          data: current.weekly.map((v, i) => Number((v + (i % 2 ? 1.4 : -1.1)).toFixed(1))),
          tone: current.tone,
        },
      ],
    };
  }, [current, range]);

  const healthScore = selected === "glucose" ? 68 : 92;

  return (
    <div className="page">
      <div className="vital-picker">
        {order.map((id) => {
          const m = meta[id];
          const Icon = iconMap[m.id];
          const val = id === "hr" ? live.hr : id === "spo2" ? live.spo2 : id === "temp" ? live.temp : m.value;
          return (
            <button
              key={id}
              className={`vp-card tone-${m.tone} ${selected === id ? "on" : ""}`}
              onClick={() => setSelected(id)}
            >
              <span className="vp-ico">
                <Icon size={18} />
              </span>
              <span className="vp-name">{m.name}</span>
              <strong>
                {val}
                <small>{m.unit}</small>
              </strong>
              <span className="vp-status">{m.tone === "warn" ? "Above target" : "In range"}</span>
            </button>
          );
        })}
      </div>

      <div className="grid main-grid">
        <Card
          title={`${current.name} — ${range === "today" ? "Today" : range === "week" ? "7-Day Average" : "5-Week Trend"}`}
          subtitle={current.notes}
          icon={<Activity size={19} />}
          span={2}
          action={<Segmented options={rangeOptions} value={range} onChange={setRange} />}
        >
          <div className="kpi-strip">
            <div>
              <span>Current</span>
              <strong>
                {liveValue} <small>{current.unit}</small>
              </strong>
            </div>
            <div>
              <span>Target range</span>
              <strong>
                {current.target[0]} – {current.target[1]} <small>{current.unit}</small>
              </strong>
            </div>
            <div>
              <span>7-day avg</span>
              <strong>
                {(
                  current.weekly.reduce((a, b) => a + b, 0) / current.weekly.length
                ).toFixed(1)}{" "}
                <small>{current.unit}</small>
              </strong>
            </div>
            <div>
              <span>Variance</span>
              <strong className={current.tone === "warn" ? "text-warn" : "text-good"}>
                {current.tone === "warn" ? "+8%" : "−3%"}
              </strong>
            </div>
          </div>

          <LineChart
            labels={chartData.labels}
            series={chartData.series}
            height={250}
            band={{ min: current.target[0], max: current.target[1] }}
            yMin={current.range[0]}
            yMax={current.range[1]}
            unit=""
          />

          <div className="band-legend">
            <span>
              <i className="band-swatch" /> Target range ({current.target[0]}–{current.target[1]}{" "}
              {current.unit})
            </span>
          </div>
        </Card>

        <Card title="Vital Position" subtitle="Where current value sits" icon={<HeartPulse size={19} />}>
          <div className="score-wrap col">
            <RingGauge
              value={healthScore}
              size={168}
              tone={healthScore >= 85 ? "good" : healthScore >= 65 ? "warn" : "danger"}
              label="vital health"
              sublabel={healthScore >= 85 ? "Excellent" : "Needs attention"}
            />
          </div>
          <div className="range-detail">
            <div className="rd-label">
              <span>Current: {liveValue} {current.unit}</span>
              <span>
                {current.target[0]} – {current.target[1]}
              </span>
            </div>
            <RangeBar
              value={Number(liveValue)}
              min={current.range[0]}
              max={current.range[1]}
              tone={current.tone}
              markers={[
                { label: "Min target", pct: ((current.target[0] - current.range[0]) / (current.range[1] - current.range[0])) * 100 },
                { label: "Max target", pct: ((current.target[1] - current.range[0]) / (current.range[1] - current.range[0])) * 100 },
              ]}
            />
            <Badge tone={current.tone === "warn" ? "warn" : "good"} dot>
              {current.tone === "warn" ? "Above target — monitor closely" : "Within safe range"}
            </Badge>
          </div>
        </Card>

        <Card
          title="Today's Readings"
          subtitle="Raw sensor log"
          icon={<Activity size={19} />}
        >
          <div className="readings">
            {readings[selected].map((r, i) => (
              <div className="reading-row" key={i}>
                <span className="rr-time">{r.t}</span>
                <span className="rr-track">
                  <i
                    style={{
                      width: `${Math.max(
                        6,
                        ((r.v - current.range[0]) / (current.range[1] - current.range[0])) * 100
                      )}%`,
                    }}
                    data-tone={current.tone}
                  />
                </span>
                <strong>
                  {r.v} <em>{current.unit}</em>
                </strong>
                <span className="rr-note">{r.n}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Weekly Comparison" subtitle="Average per day" icon={<BarChartIcon />}>
          <BarChart
            labels={["M", "T", "W", "T", "F", "S", "S"]}
            series={[{ name: current.name, data: current.weekly, tone: current.tone }]}
            height={200}
            showValues
            max={Math.ceil(Math.max(...current.weekly) * 1.2)}
          />
        </Card>

        <Card title="Clinical Thresholds" subtitle="When CareGuard will alert you" icon={<Wind size={19} />}>
          <div className="thresholds">
            {[
              { l: "Low alert below", v: `${current.target[0]} ${current.unit}`, t: "info" },
              { l: "High alert above", v: `${current.target[1]} ${current.unit}`, t: "warn" },
              { l: "Critical threshold", v: `${current.range[1]} ${current.unit}`, t: "danger" },
              { l: "Notify after", v: "2 consecutive readings", t: "neutral" },
              { l: "Escalation", v: "Aryaa → Rohit → 112", t: "neutral" },
            ].map((t) => (
              <div className="thr-row" key={t.l}>
                <span>{t.l}</span>
                <Badge tone={t.t}>{t.v}</Badge>
              </div>
            ))}
          </div>
          <div className="note-box">
            <HeartPulse size={15} />
            <p>
              Thresholds are suggestions only and are not a medical device. Always consult a
              qualified doctor before changing treatment.
            </p>
          </div>
        </Card>

        <Card title="Health Vitals Summary" subtitle="All six tracked readings" icon={<Activity size={19} />} className="full-card">
          <div className="summary-grid">
            {order.map((id) => {
              const m = meta[id];
              const Icon = iconMap[m.id];
              const val = id === "hr" ? live.hr : id === "spo2" ? live.spo2 : id === "temp" ? live.temp : m.value;
              return (
                <div className={`sum-cell tone-${m.tone}`} key={id}>
                  <span className="sc-ic">
                    <Icon size={16} />
                  </span>
                  <span className="sc-l">{m.name}</span>
                  <strong>
                    {val}
                    <em>{m.unit}</em>
                  </strong>
                  <Badge tone={m.tone}>{m.tone === "warn" ? "High" : "Normal"}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BarChartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 21h18M6 21V11M11 21V5M16 21v-7M21 21v-4" />
    </svg>
  );
}
