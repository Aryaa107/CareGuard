import { useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  FileText,
  Lightbulb,
  Printer,
  Share2,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { BarChart, DonutChart, LineChart, MiniBars, RingGauge } from "../components/Charts";
import { Badge, Button, Card, ProgressBar, Segmented } from "../components/UI";
import { useCare } from "../context/careContext";
import {
  adherence,
  bpTrend,
  heartTrend,
  vitals,
  weekMood,
  weekSleep,
  weekSteps,
  weeklyReport,
} from "../data/careData";

const rangeOptions = [
  { id: "week", label: "7 Days" },
  { id: "month", label: "30 Days" },
  { id: "quarter", label: "90 Days" },
];

const insights = [
  {
    id: 1,
    tone: "good",
    title: "Medication adherence is improving",
    body: "Adherence rose from 86% to 94% over the last three weeks. The lunch reminder change appears to be working.",
    tag: "Adherence",
    impact: "High",
  },
  {
    id: 2,
    tone: "warn",
    title: "Post-lunch blood sugar trending high",
    body: "Average post-lunch reading is 152 mg/dL, up 14 points. Three readings in the last week exceeded 165.",
    tag: "Diabetes",
    impact: "High",
  },
  {
    id: 3,
    tone: "info",
    title: "Best activity window is early morning",
    body: "68% of daily steps happen between 8 and 10 AM. Scheduling the walk earlier protects the daily goal.",
    tag: "Activity",
    impact: "Medium",
  },
  {
    id: 4,
    tone: "good",
    title: "Sleep quality stabilised",
    body: "Average sleep reached 7.2 hours, the highest in three months. Screen-off time moved to 9:40 PM.",
    tag: "Sleep",
    impact: "Medium",
  },
  {
    id: 5,
    tone: "danger",
    title: "Friday evenings show low engagement",
    body: "Activity, mood and check-ins all dip on Fridays. Consider a family call earlier in the day.",
    tag: "Pattern",
    impact: "Low",
  },
  {
    id: 6,
    tone: "info",
    title: "Blood pressure fully in target",
    body: "Six of seven days stayed below 130/85, the best result since monitoring began.",
    tag: "Cardiac",
    impact: "High",
  },
];

export default function Reports() {
  const { pushToast } = useCare();
  const [range, setRange] = useState("week");

  return (
    <div className="page">
      <Card
        title="Weekly Care Report"
        subtitle="Generated automatically every Sunday at 8:00 PM"
        icon={<FileText size={19} />}
        action={
          <>
            <Segmented options={rangeOptions} value={range} onChange={setRange} />
            <Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => pushToast("Sending to printer…", "info")}>
              Print
            </Button>
            <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => pushToast("PDF downloaded", "good")}>
              PDF
            </Button>
            <Button variant="ghost" size="sm" icon={<Share2 size={14} />} onClick={() => pushToast("Report shared with the care circle", "good")}>
              Share
            </Button>
          </>
        }
      >
        <div className="report-hero">
          <div className="rh-score">
            <RingGauge
              value={weeklyReport.score}
              size={186}
              tone="good"
              label="Care score"
              sublabel={`+${weeklyReport.change} points`}
            />
          </div>
          <div className="rh-body">
            <div className="rh-head">
              <Badge tone="good" dot>
                Good week
              </Badge>
              <span>
                <CalendarDays size={14} /> Aug 24 – Aug 30, 2026
              </span>
            </div>
            <h3>Sarala had a stable, positive week</h3>
            <p>
              Four areas improved. Two need attention: post-meal blood sugar and Friday
              evening engagement. No safety incidents required intervention.
            </p>
            <div className="rh-metrics">
              {[
                { l: "Medication", v: 94, t: "good" },
                { l: "Activity", v: 86, t: "info" },
                { l: "Sleep", v: 78, t: "warn" },
                { l: "Vitals", v: 92, t: "good" },
                { l: "Check-ins", v: 86, t: "info" },
                { l: "Response", v: 100, t: "good" },
              ].map((m) => (
                <ProgressBar key={m.l} value={m.v} tone={m.t} label={m.l} right={`${m.v}%`} />
              ))}
            </div>
          </div>
        </div>

        <div className="report-cols">
          <div className="rc-col">
            <h4 className="rc-head good">
              <Check size={16} /> What went well
            </h4>
            <ul className="rc-list">
              {weeklyReport.highlights.map((h) => (
                <li key={h}>
                  <Check size={14} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rc-col">
            <h4 className="rc-head warn">
              <TriangleAlert size={16} /> Needs attention
            </h4>
            <ul className="rc-list">
              {weeklyReport.concerns.map((c) => (
                <li key={c}>
                  <TriangleAlert size={14} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <div className="rc-actions">
              <Button variant="ghost" size="sm" onClick={() => pushToast("Task assigned to Rohit", "good")}>
                Assign a task
              </Button>
              <Button variant="ghost" size="sm" onClick={() => pushToast("Reminder set for the doctor", "good")}>
                Set a reminder
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid main-grid">
        <Card title="Smart Insights" subtitle="Generated from 90 days of data" icon={<Sparkles size={19} />} span={2}>
          <div className="insight-grid">
            {insights.map((i) => (
              <div className={`insight tone-${i.tone}`} key={i.id}>
                <div className="in-head">
                  <span className="in-tag">
                    {i.tag}
                  </span>
                  <Badge tone={i.tone === "danger" ? "danger" : i.tone === "warn" ? "warn" : i.tone === "good" ? "good" : "info"}>
                    {i.impact} impact
                  </Badge>
                </div>
                <strong>{i.title}</strong>
                <p>{i.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Score Composition" subtitle="How the 87 is calculated" icon={<Lightbulb size={19} />}>
          <DonutChart
            size={190}
            centerValue="87"
            centerLabel="care score"
            segments={[
              { label: "Medication", value: 30, color: "var(--c-good)" },
              { label: "Vitals", value: 26, color: "var(--c-info)" },
              { label: "Activity", value: 20, color: "var(--c-primary)" },
              { label: "Sleep", value: 14, color: "var(--c-warn)" },
              { label: "Safety", value: 10, color: "var(--c-accent)" },
            ]}
          />
          <div className="donut-legend">
            {[
              { l: "Medication", c: "var(--c-good)" },
              { l: "Vitals", c: "var(--c-info)" },
              { l: "Activity", c: "var(--c-primary)" },
              { l: "Sleep", c: "var(--c-warn)" },
              { l: "Safety", c: "var(--c-accent)" },
            ].map((s) => (
              <span key={s.l}>
                <i style={{ background: s.c }} /> {s.l}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Heart Rate Trend" subtitle="Resting vs. walking average" icon={<TrendingUp size={19} />}>
          <LineChart labels={heartTrend.labels} series={heartTrend.series} height={220} band={{ min: 60, max: 100 }} />
        </Card>

        <Card title="Blood Pressure" subtitle="Weekly systolic vs. diastolic" icon={<TrendingUp size={19} />}>
          <LineChart labels={bpTrend.labels} series={bpTrend.series} height={220} band={{ min: 90, max: 130 }} />
        </Card>

        <Card title="Activity & Sleep" subtitle="Daily movement" icon={<TrendingUp size={19} />}>
          <BarChart
            labels={weekSteps.map((s) => s.label)}
            series={[{ name: "Steps", data: weekSteps.map((s) => s.value), tone: "primary" }]}
            height={180}
            target={8000}
          />
        </Card>

        <Card title="Mood & Sleep" subtitle="Weekly self-reported" icon={<TrendingUp size={19} />}>
          <MiniBars data={weekSleep} tone="info" height={70} />
          <div className="mini-labels">
            {weekMood.map((m, i) => (
              <span key={i}>{m.label}</span>
            ))}
          </div>
          <div className="split-metrics">
            <div>
              <span>Avg sleep</span>
              <strong>7.2 h</strong>
            </div>
            <div>
              <span>Avg mood</span>
              <strong>7.1 / 10</strong>
            </div>
          </div>
        </Card>

        <Card title="Medication Adherence" subtitle="Weekly breakdown" icon={<TrendingUp size={19} />} span={2}>
          <BarChart labels={adherence.labels} series={adherence.series} height={200} max={100} unit="%" />
        </Card>

        <Card title="Comparison" subtitle="This week vs. last week" icon={<TrendingUp size={19} />}>
          <div className="cmp-list">
            {[
              { l: "Care score", a: 87, b: 83, up: true },
              { l: "Med adherence", a: 94, b: 86, up: true },
              { l: "Avg steps", a: 5890, b: 5402, up: true },
              { l: "Avg sleep", a: 7.2, b: 6.7, up: true },
              { l: "BP average", a: 118, b: 123, up: false },
              { l: "Alerts", a: 3, b: 5, up: false },
            ].map((c) => (
              <div className="cmp-row" key={c.l}>
                <span>{c.l}</span>
                <strong>{c.a.toLocaleString()}</strong>
                <span className={`cmp-delta ${c.up ? "up" : "down"}`}>
                  {c.up ? "▲" : "▼"} {Math.abs(((c.a - c.b) / c.b) * 100).toFixed(1)}%
                </span>
                <em>was {c.b.toLocaleString()}</em>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Hourly Vitals Archive" subtitle="Today's raw data" icon={<TrendingUp size={19} />} span={2}>
          <BarChart
            labels={vitals.labels.filter((_, i) => i % 3 === 0)}
            series={[{ name: "Heart rate", data: vitals.hr.filter((_, i) => i % 3 === 0), tone: "primary" }]}
            height={170}
            max={100}
          />
        </Card>
      </div>
    </div>
  );
}
