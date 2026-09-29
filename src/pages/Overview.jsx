import { useMemo, useState } from "react";
import {
  Activity,
  Battery,
  BellRing,
  CalendarDays,
  ChevronRight,
  Droplets,
  Footprints,
  HeartPulse,
  MapPin,
  Moon,
  Phone,
  Pill,
  PhoneCall,
  ShieldCheck,
  Siren,
  Thermometer,
  Wind,
} from "lucide-react";

import { LineChart, MiniBars, RingGauge, Sparkline } from "../components/Charts";
import {
  Badge,
  Button,
  Card,
  CheckPill,
  Icon,
  ProgressBar,
  Segmented,
} from "../components/UI";
import StatCard from "../components/StatCard";
import { useCare } from "../context/careContext";
import {
  activityTimeline,
  heartTrend,
  locationHistory,
  vitals,
  weekSleep,
  weeklyReport,
} from "../data/careData";

const rangeOptions = [
  { id: "day", label: "Today" },
  { id: "week", label: "7 Days" },
  { id: "month", label: "30 Days" },
];

export default function Overview() {
  const {
    live,
    alerts,
    unreadCount,
    medications,
    medsTaken,
    adherencePct,
    nextMed,
    wellness,
    wellnessPct,
    toggleWellness,
    navigate,
    startSos,
    pushToast,
  } = useCare();

  const [range, setRange] = useState("day");

  // Prevent the page from crashing when vitals is null
  const safeVitals = vitals ?? {
    hr: [],
    spo2: [],
    steps: [],
    temp: [],
    labels: [],
  };

  const series = useMemo(() => {
    if (range === "day") {
      return {
        labels: safeVitals.labels ?? [],
        series: [
          {
            name: "Heart Rate",
            data: safeVitals.hr ?? [],
            tone: "primary",
          },
        ],
      };
    }

    if (range === "week") {
      return {
        labels: heartTrend?.labels ?? [],
        series: heartTrend?.series ?? [],
      };
    }

    return {
      labels: ["W1", "W2", "W3", "W4", "W5"],
      series: [
        {
          name: "Heart Rate",
          data: [74, 77, 75, 79, 76],
          tone: "primary",
        },
      ],
    };
  }, [range, safeVitals, heartTrend]);

  const stats = [
    {
      label: "Heart Rate",
      value: live.hr,
      unit: "BPM",
      trend: -3,
      status: "Normal range",
      tone: "good",
      series: safeVitals.hr,
      icon: <HeartPulse size={20} />,
      go: "health",
    },
    {
      label: "Blood Oxygen",
      value: live.spo2,
      unit: "%",
      trend: 1,
      status: "Normal range",
      tone: "good",
      series: safeVitals.spo2,
      icon: <Wind size={20} />,
      go: "health",
    },
    {
      label: "Steps Today",
      value: "6,842",
      unit: "steps",
      trend: 12,
      status: "Goal 8,000 · 86%",
      tone: "info",
      series: safeVitals.steps,
      icon: <Footprints size={20} />,
      go: "activity",
    },
    {
      label: "Body Temp",
      value: live.temp,
      unit: "°C",
      trend: 0,
      status: "Normal · 36.1–37.2",
      tone: "good",
      series: safeVitals.temp,
      icon: <Thermometer size={20} />,
      go: "health",
    },
  ];

  const score = weeklyReport.score;
  const ringTone =
    score >= 80 ? "good" : score >= 60 ? "warn" : "danger";

  return (
    <div className="page">
      <div className="banner safe">
        <div className="banner-ico">
          <ShieldCheck size={26} />
        </div>

        <div className="banner-text">
          <strong>All clear — Sarala is safe at home</strong>
          <p>
            Last check-in 4 minutes ago · All 6 vitals within target · 3 of 4
            medications taken
          </p>
        </div>

        <div className="banner-actions">
          <Badge tone="good" dot>
            No active incidents
          </Badge>

          <Button
            variant="danger"
            size="sm"
            icon={<Siren size={15} />}
            onClick={startSos}
          >
            SOS
          </Button>
        </div>
      </div>

      <div className="grid stats-grid">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            {...s}
            onClick={() => navigate(s.go)}
          />
        ))}
      </div>

      <div className="grid main-grid">
        <Card
          title="Heart Rate Trend"
          subtitle="Live reading vs. weekly baseline"
          icon={<HeartPulse size={19} />}
          span={2}
          action={
            <Segmented
              options={rangeOptions}
              value={range}
              onChange={setRange}
            />
          }
        >
          <div className="kpi-strip">
            <div>
              <span>Current</span>
              <strong>
                {live.hr} <small>BPM</small>
              </strong>
            </div>

            <div>
              <span>Average</span>
              <strong>
                {series.series[0].data.length > 0
                  ? Math.round(
                      series.series[0].data.reduce(
                        (a, b) => a + b,
                        0
                      ) / series.series[0].data.length
                    )
                  : 0}{" "}
                <small>BPM</small>
              </strong>
            </div>

            <div>
              <span>Peak</span>
              <strong>
                {series.series[0].data.length > 0
                  ? Math.max(...series.series[0].data)
                  : 0}{" "}
                <small>BPM</small>
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong className="text-good">Normal</strong>
            </div>
          </div>

          <LineChart
            labels={series.labels}
            series={series.series}
            unit=""
            height={230}
            yMin={55}
            yMax={105}
            band={range === "day" ? { min: 60, max: 100 } : null}
          />
        </Card>

        <Card
          title="Care Score"
          subtitle="Last 7 days"
          icon={<ShieldCheck size={19} />}
        >
          <div className="score-wrap">
            <RingGauge
              value={score}
              size={172}
              tone={ringTone}
              label="Care score"
              sublabel={`+${weeklyReport.change} vs last week`}
            />

            <div className="score-legend">
              {[
                { l: "Medication", v: 94, t: "good" },
                { l: "Activity", v: 86, t: "info" },
                { l: "Sleep", v: 78, t: "warn" },
                { l: "Vitals", v: 92, t: "good" },
              ].map((r) => (
                <ProgressBar
                  key={r.l}
                  value={r.v}
                  tone={r.t}
                  label={r.l}
                  right={`${r.v}%`}
                />
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            full
            onClick={() => navigate("reports")}
          >
            View full report <ChevronRight size={15} />
          </Button>
        </Card>

        <Card
          title="Today's Vitals"
          subtitle="Latest sensor readings"
          icon={<Activity size={19} />}
        >
          <div className="vital-rows">
            {[
              {
                i: <HeartPulse size={16} />,
                l: "Heart Rate",
                v: `${live.hr} BPM`,
                t: "good",
                s: "60 – 100",
              },
              {
                i: <Wind size={16} />,
                l: "SpO₂",
                v: `${live.spo2}%`,
                t: "good",
                s: "95 – 100",
              },
              {
                i: <Activity size={16} />,
                l: "Blood Pressure",
                v: "118/76",
                t: "good",
                s: "< 130/85",
              },
              {
                i: <Droplets size={16} />,
                l: "Blood Sugar",
                v: "112 mg/dL",
                t: "warn",
                s: "80 – 140",
              },
              {
                i: <Thermometer size={16} />,
                l: "Temperature",
                v: `${live.temp} °C`,
                t: "good",
                s: "36.1 – 37.2",
              },
            ].map((r) => (
              <div className="vital-row" key={r.l}>
                <span className={`vr-ico tone-${r.t}`}>
                  {r.i}
                </span>

                <span className="vr-name">{r.l}</span>

                <strong>{r.v}</strong>

                <em>{r.s}</em>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            full
            onClick={() => navigate("health")}
          >
            Open health monitor <ChevronRight size={15} />
          </Button>
        </Card>

        <Card
          title="Medication Schedule"
          subtitle={`${medsTaken} of ${medications.length} taken today`}
          icon={<Pill size={19} />}
          action={
            <Badge tone={adherencePct === 100 ? "good" : "warn"}>
              {adherencePct}%
            </Badge>
          }
        >
          <div className="med-list">
            {medications.map((m) => (
              <div
                key={m.id}
                className={`med-row ${m.taken ? "taken" : ""}`}
              >
                <span className="med-time">{m.time}</span>

                <span
                  className="med-dot"
                  style={{ background: m.color }}
                />

                <span className="med-name">
                  <strong>{m.name}</strong>

                  <em>
                    {m.dose}
                    {m.withFood ? " · after food" : ""}
                  </em>
                </span>

                {m.taken ? (
                  <Badge tone="good" dot>
                    {m.takenAt}
                  </Badge>
                ) : (
                  <Badge tone="warn">Due</Badge>
                )}
              </div>
            ))}
          </div>

          {nextMed && (
            <div className="next-med">
              <BellRing size={15} />

              <span>
                Next: <strong>{nextMed.name}</strong> at {nextMed.time}
              </span>
            </div>
          )}
        </Card>

        <Card
          title="Daily Wellness"
          subtitle={`${wellnessPct}% complete`}
          icon={<CalendarDays size={19} />}
        >
          <ProgressBar
            value={wellnessPct}
            tone="primary"
          />

          <div className="pill-list">
            {wellness.map((w) => (
              <CheckPill
                key={w.id}
                done={w.done}
                onToggle={() => toggleWellness(w.id)}
                title={w.title}
                detail={w.detail}
                icon={w.icon}
              />
            ))}
          </div>
        </Card>

        <Card
          title="Activity Timeline"
          subtitle="Today's movement"
          icon={<Footprints size={19} />}
          action={
            <Badge tone="info">6,842 steps</Badge>
          }
        >
          <div className="timeline">
            {activityTimeline.map((t, i) => (
              <div className="tl-row" key={i}>
                <span className={`tl-dot tone-${t.tone}`} />

                <div className="tl-time">
                  {t.time}
                </div>

                <div className="tl-body">
                  <strong>{t.label}</strong>
                  <em>{t.detail}</em>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            full
            onClick={() => navigate("activity")}
          >
            Open activity <ChevronRight size={15} />
          </Button>
        </Card>

        <Card
          title="Sleep Quality"
          subtitle="Last 7 nights"
          icon={<Moon size={19} />}
        >
          <div className="sleep-head">
            <div>
              <strong>7.2</strong>
              <span>avg hours</span>
            </div>

            <Badge tone="good">+38 min</Badge>
          </div>

          <MiniBars
            data={weekSleep}
            tone="info"
            height={70}
          />

          <div className="mini-labels">
            {weekSleep.map((s, i) => (
              <span key={i}>{s.label}</span>
            ))}
          </div>

          <div className="sleep-legend">
            <span>
              <i style={{ background: "var(--c-good)" }} />
              Deep sleep 2h 10m
            </span>

            <span>
              <i style={{ background: "var(--c-info)" }} />
              Light sleep 4h 25m
            </span>

            <span>
              <i style={{ background: "var(--c-warn)" }} />
              Awake 0h 45m
            </span>
          </div>
        </Card>

        <Card
          title="Where Is Sarala"
          subtitle="Updated 2 min ago"
          icon={<MapPin size={19} />}
        >
          <div className="loc-card">
            <div className="loc-badge">
              <MapPin size={20} />
            </div>

            <div>
              <strong>Home</strong>
              <p>Flat 4B, Green Meadows, Kochi</p>
              <span>
                Inside Home safe zone · 120 m radius
              </span>
            </div>
          </div>

          <div className="loc-history">
            {locationHistory.map((l, i) => (
              <div className="lh-row" key={i}>
                <span className="lh-ico">
                  <Icon name={l.icon} size={14} />
                </span>

                <strong>{l.place}</strong>

                <em>{l.time}</em>

                <span className="lh-dur">
                  {l.duration}
                </span>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            full
            onClick={() => navigate("location")}
          >
            Open live map <ChevronRight size={15} />
          </Button>
        </Card>

        <Card
          title="Recent Alerts"
          subtitle={`${unreadCount} unread`}
          icon={<BellRing size={19} />}
          action={
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate("alerts")}
            >
              View all
            </Button>
          }
        >
          <div className="alert-list">
            {alerts.slice(0, 4).map((a) => (
              <div
                className={`alert-row ${a.read ? "read" : ""}`}
                key={a.id}
              >
                <span
                  className={`ar-ico tone-${a.type}`}
                >
                  <Icon
                    name={a.icon}
                    size={15}
                  />
                </span>

                <div className="ar-body">
                  <strong>{a.title}</strong>
                  <em>{a.detail}</em>
                </div>

                <span className="ar-time">
                  {a.time}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Quick Actions"
          subtitle="One tap to help"
          icon={<PhoneCall size={19} />}
        >
          <div className="quick-grid">
            <button
              className="q-btn danger"
              onClick={startSos}
            >
              <Siren size={20} />
              <span>SOS</span>
            </button>

            <button
              className="q-btn"
              onClick={() =>
                pushToast(
                  "Calling Aryaa Menon…",
                  "info"
                )
              }
            >
              <Phone size={20} />
              <span>Call</span>
            </button>

            <button
              className="q-btn"
              onClick={() =>
                pushToast(
                  "Video call started with Sarala",
                  "good"
                )
              }
            >
              <PhoneCall size={20} />
              <span>Video</span>
            </button>

            <button
              className="q-btn"
              onClick={() =>
                pushToast(
                  "Reminder sent to Sarala's watch",
                  "good"
                )
              }
            >
              <BellRing size={20} />
              <span>Remind</span>
            </button>
          </div>

          <div className="device-row">
            <span>
              <Battery size={15} /> CareBand X2
            </span>

            <Badge tone="good" dot>
              {live.battery}%
            </Badge>

            <span className="device-name">
              <Activity size={13} /> Strong
            </span>
          </div>
        </Card>
      </div>

      <Card
        title="This Week at a Glance"
        subtitle="Rolling 7-day summary"
        className="full-card"
      >
        <div className="week-grid">
          {[
            {
              l: "Avg Heart Rate",
              v: "72 BPM",
              d: "-2 vs last week",
              t: "good",
            },
            {
              l: "Avg Sleep",
              v: "7.2 h",
              d: "+38 min",
              t: "good",
            },
            {
              l: "Total Steps",
              v: "41.2k",
              d: "+9%",
              t: "good",
            },
            {
              l: "Med Adherence",
              v: "94%",
              d: "+8%",
              t: "good",
            },
            {
              l: "Incidents",
              v: "1",
              d: "Resolved",
              t: "warn",
            },
            {
              l: "Check-ins",
              v: "6/7",
              d: "1 missed",
              t: "info",
            },
          ].map((s) => (
            <div
              className="week-cell"
              key={s.l}
            >
              <span>{s.l}</span>
              <strong>{s.v}</strong>
              <em className={`text-${s.t}`}>
                {s.d}
              </em>
            </div>
          ))}
        </div>

        <div className="week-spark">
          <Sparkline
            data={safeVitals.hr}
            tone="primary"
            width={200}
            height={40}
          />
        </div>
      </Card>
    </div>
  );
}