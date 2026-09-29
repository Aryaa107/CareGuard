import { useState } from "react";
import {
  Activity as ActivityIcon,
  Battery,
  Bed,
  Footprints,
  Moon,
  ShieldAlert,
  Timer,
  TrendingUp,
  Watch,
} from "lucide-react";
import { ActivityHeatmap, BarChart, LineChart, RingGauge } from "../components/Charts";
import { Badge, Button, Card, Modal, ProgressBar, Segmented } from "../components/UI";
import { useCare } from "../context/careContext";
import { activityTimeline, vitals, weekMood, weekSleep, weekSteps } from "../data/careData";

const goals = { steps: 8000, active: 30, sleep: 8 };

export default function Activity() {
  const { live, pushToast, settings } = useCare();
  const [range, setRange] = useState("week");
  const [fallOpen, setFallOpen] = useState(false);
  const [simCount, setSimCount] = useState(3);

  const rangeOptions = [
    { id: "day", label: "Today" },
    { id: "week", label: "7 Days" },
    { id: "month", label: "30 Days" },
  ];

  const stepTotal = weekSteps.reduce((a, b) => a + b.value, 0);
  const stepPct = Math.round((stepTotal / (goals.steps * 7)) * 100);
  const todayPct = Math.min(100, Math.round((6842 / goals.steps) * 100));
  const sleepAvg = (weekSleep.reduce((a, b) => a + b.value, 0) / weekSleep.length).toFixed(1);

  return (
    <div className="page">
      <div className="grid main-grid">
        <Card
          title="Steps Today"
          subtitle="Live step count from CareBand X2"
          icon={<Footprints size={19} />}
          span={2}
        >
          <div className="ring-row">
            <RingGauge
              value={todayPct}
              size={176}
              tone="primary"
              label="of daily goal"
              sublabel={`${goals.steps.toLocaleString()} steps`}
            />
            <div className="ring-side">
              <div className="big-num">
                <strong>6,842</strong>
                <span>steps</span>
              </div>
              <ProgressBar value={6842} max={goals.steps} tone="primary" label="Goal progress" right={`${todayPct}%`} />
              <div className="mini-facts">
                <div>
                  <span>Distance</span>
                  <strong>4.6 km</strong>
                </div>
                <div>
                  <span>Calories</span>
                  <strong>312 kcal</strong>
                </div>
                <div>
                  <span>Active time</span>
                  <strong>42 min</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Fall Detection" subtitle={`Sensitivity: ${settings.fallSensitivity}`} icon={<ShieldAlert size={19} />}>
          <div className={`fall-status ${fallOpen ? "triggered" : ""}`}>
            <span className="fs-pulse" />
            <div>
              <strong>{fallOpen ? "Possible fall detected" : "No falls detected"}</strong>
              <em>{fallOpen ? "Impact detected 2 seconds ago — responding" : "Monitoring active · 0 incidents in 30 days"}</em>
            </div>
          </div>

          <div className="fall-stats">
            {[
              { l: "Falls (30d)", v: "0" },
              { l: "Near-misses", v: "3" },
              { l: "Indoor events", v: "1,208" },
              { l: "Avg response", v: "4.2s" },
            ].map((s) => (
              <div className="fs-cell" key={s.l}>
                <span>{s.l}</span>
                <strong>{s.v}</strong>
              </div>
            ))}
          </div>

          <div className="sensitivity">
            {["Low", "Balanced", "High"].map((s) => (
              <button
                key={s}
                className={settings.fallSensitivity === s ? "on" : ""}
                onClick={() => pushToast(`Fall sensitivity set to ${s}`, "good")}
              >
                {s}
              </button>
            ))}
          </div>

          <Button
            variant="danger"
            full
            icon={<ShieldAlert size={16} />}
            onClick={() => {
              setFallOpen(true);
              setSimCount((c) => c + 1);
            }}
          >
            Simulate fall alert
          </Button>
        </Card>

        <Card
          title="Hourly Movement"
          subtitle="Steps per hour today"
          icon={<ActivityIcon size={19} />}
          span={2}
          action={<Segmented options={rangeOptions} value={range} onChange={setRange} />}
        >
          <BarChart
            labels={vitals.labels.filter((_, i) => i % 2 === 0)}
            series={[{ name: "Steps", data: vitals.steps.filter((_, i) => i % 2 === 0), tone: "primary" }]}
            height={220}
            target={500}
          />
          <div className="note-box">
            <TrendingUp size={15} />
            <p>
              Peak activity window is <strong>8 – 10 AM</strong>. A gentle 20-minute afternoon
              walk would close the 1,158-step gap to today&apos;s goal.
            </p>
          </div>
        </Card>

        <Card title="Weekly Steps" subtitle={`${stepTotal.toLocaleString()} total`} icon={<Footprints size={19} />}>
          <BarChart
            labels={weekSteps.map((s) => s.label)}
            series={[{ name: "Steps", data: weekSteps.map((s) => s.value), tone: "primary" }]}
            height={190}
            target={goals.steps}
          />
          <div className="kpi-strip tight">
            <div>
              <span>Goal hit</span>
              <strong>
                {weekSteps.filter((s) => s.value >= goals.steps).length}/7
              </strong>
            </div>
            <div>
              <span>Adherence</span>
              <strong>{stepPct}%</strong>
            </div>
            <div>
              <span>Best day</span>
              <strong>{weekSteps[5].label}</strong>
            </div>
          </div>
        </Card>

        <Card title="Sleep Analysis" subtitle={`Average ${sleepAvg} hours`} icon={<Moon size={19} />}>
          <div className="sleep-stages">
            {[
              { l: "Deep", v: 1.8, t: "primary" },
              { l: "REM", v: 1.4, t: "info" },
              { l: "Light", v: 3.6, t: "good" },
              { l: "Awake", v: 0.4, t: "warn" },
            ].map((s) => (
              <div className="stage-row" key={s.l}>
                <span>{s.l}</span>
                <ProgressBar value={s.v} max={7.4} tone={s.t} right={`${s.v}h`} />
              </div>
            ))}
          </div>
          <div className="sleep-score">
            <span>
              <Bed size={16} /> Sleep quality
            </span>
            <strong>82 / 100</strong>
            <Badge tone="good">Good</Badge>
          </div>
          <BarChart
            labels={weekSleep.map((s) => s.label)}
            series={[{ name: "Hours", data: weekSleep.map((s) => s.value), tone: "info" }]}
            height={140}
            max={10}
            target={goals.sleep}
          />
        </Card>

        <Card title="Inactivity Watch" subtitle="Daytime stillness detection" icon={<Timer size={19} />}>
          <div className="inactive-list">
            {[
              { d: "Today", m: "2:15 PM", len: "95 min", t: "warn" },
              { d: "Yesterday", m: "3:40 PM", len: "110 min", t: "info" },
              { d: "Mon", m: "1:20 PM", len: "78 min", t: "info" },
              { d: "Sun", m: "2:50 PM", len: "64 min", t: "good" },
            ].map((r, i) => (
              <div className="in-row" key={i}>
                <span className="in-day">{r.d}</span>
                <strong>{r.m}</strong>
                <span className="in-len">{r.len}</span>
                <Badge tone={r.t}>{r.t === "warn" ? "Review" : r.t === "info" ? "Noted" : "Fine"}</Badge>
              </div>
            ))}
          </div>
          <div className="note-box">
            <Timer size={15} />
            <p>Alert fires after 90 minutes of no movement during 8 AM – 8 PM.</p>
          </div>
        </Card>

        <Card title="Wellbeing & Mood" subtitle="Weekly self-check-ins" icon={<Bed size={19} />}>
          <BarChart
            labels={weekMood.map((m) => m.label)}
            series={[{ name: "Mood", data: weekMood.map((m) => m.value), tone: "warn" }]}
            height={150}
            max={10}
            target={6}
            showValues
          />
          <div className="mood-legend">
            <span>
              <i className="face" /> Good days: 5 of 7
            </span>
            <span>
              <i className="face sad" /> Low day: Friday
            </span>
          </div>
        </Card>

        <Card title="Activity Consistency" subtitle="Last 12 weeks" icon={<ActivityIcon size={19} />}>
          <ActivityHeatmap weeks={12} seed={11} />
          <p className="hm-note">
            84% of days met the movement target. Consistency is <strong>up 12%</strong> compared
            to last quarter.
          </p>
        </Card>

        <Card title="Wearable Device" subtitle="CareBand X2" icon={<Watch size={19} />} span={2}>
          <div className="device-card">
            <div className="dc-head">
              <Watch size={22} />
              <div>
                <strong>CareBand X2</strong>
                <em>SN: CGX2-77451</em>
              </div>
              <Badge tone="good" dot>
                Connected
              </Badge>
            </div>
            <div className="dc-stats">
              <div>
                <Battery size={15} />
                <span>Battery</span>
                <strong>{live.battery}%</strong>
              </div>
              <div>
                <ActivityIcon size={15} />
                <span>Signal</span>
                <strong>Strong</strong>
              </div>
              <div>
                <Watch size={15} />
                <span>Firmware</span>
                <strong>4.2.1</strong>
              </div>
              <div>
                <Timer size={15} />
                <span>Worn</span>
                <strong>18h today</strong>
              </div>
            </div>
            <LineChart
              labels={vitals.labels.filter((_, i) => i % 3 === 0)}
              series={[{ name: "Movement", data: vitals.steps.filter((_, i) => i % 3 === 0), tone: "primary" }]}
              height={120}
              showDots={false}
            />
            <Button
              variant="ghost"
              full
              onClick={() => pushToast("Firmware 4.2.1 is up to date", "info")}
            >
              Check for updates
            </Button>
          </div>
        </Card>

        <Card title="Movement Timeline" subtitle="Today" icon={<ActivityIcon size={19} />} span={2}>
          <div className="timeline wide">
            {activityTimeline.map((t, i) => (
              <div className="tl-row" key={i}>
                <span className={`tl-dot tone-${t.tone}`} />
                <div className="tl-time">{t.time}</div>
                <div className="tl-body">
                  <strong>{t.label}</strong>
                  <em>{t.detail}</em>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={fallOpen}
        onClose={() => setFallOpen(false)}
        title="Possible fall detected"
        subtitle="CareBand X2 reported a hard impact followed by no movement"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setFallOpen(false);
                pushToast("Alert resolved — false alarm", "good");
              }}
            >
              False alarm
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setFallOpen(false);
                pushToast("Emergency workflow started", "danger", 5000);
              }}
            >
              Start emergency response
            </Button>
          </>
        }
      >
        <div className="fall-modal">
          <div className="fm-count">
            <span>Responding in</span>
            <strong>10s</strong>
          </div>
          <div className="fm-rows">
            {[
              { l: "Detected at", v: "Just now" },
              { l: "Impact force", v: "4.1 g" },
              { l: "Location", v: "Home · Living room" },
              { l: "Heart rate after", v: `${live.hr} BPM (elevated)` },
              { l: "Consecutive alerts", v: simCount },
            ].map((r) => (
              <div className="fm-row" key={r.l}>
                <span>{r.l}</span>
                <strong>{r.v}</strong>
              </div>
            ))}
          </div>
          <p>
            CareGuard will call Aryaa first, then Rohit, then the city emergency line. Live
            location and the medical profile are attached to the call.
          </p>
        </div>
      </Modal>
    </div>
  );
}
