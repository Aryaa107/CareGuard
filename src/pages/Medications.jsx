import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  Clock,
  Package,
  Pill,
  Plus,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { BarChart, DonutChart, RingGauge } from "../components/Charts";
import { Badge, Button, Card, Modal, ProgressBar, Segmented } from "../components/UI";
import { useCare } from "../context/careContext";

const inventory = [
  { name: "Metformin 500mg", left: 18, total: 30, refill: "In 9 days" },
  { name: "Amlodipine 5mg", left: 24, total: 30, refill: "In 12 days" },
  { name: "Vitamin D3", left: 12, total: 30, refill: "In 6 days" },
  { name: "Atorvastatin 10mg", left: 9, total: 30, refill: "In 3 days" },
];

const interactions = [
  { a: "Metformin", b: "Atorvastatin", note: "Monitor for muscle pain", tone: "warn" },
  { a: "Amlodipine", b: "Vitamin D3", note: "No known interaction", tone: "good" },
  { a: "Atorvastatin", b: "Grapefruit", note: "Avoid grapefruit juice", tone: "warn" },
];

export default function Medications() {
  const {
    medications,
    medsTaken,
    adherencePct,
    markMedication,
    nextMed,
    pushToast,
    adherence,
  } = useCare();
  const [tab, setTab] = useState("today");
  const [addOpen, setAddOpen] = useState(false);

  const tabOptions = [
    { id: "today", label: "Today" },
    { id: "week", label: "Adherence" },
    { id: "stock", label: "Stock" },
  ];

  const missed = useMemo(
    () => medications.filter((m) => !m.taken).length,
    [medications]
  );

  return (
    <div className="page">
      <div className="grid main-grid">
        <Card
          title="Today's Schedule"
          subtitle={`${medsTaken} of ${medications.length} taken`}
          icon={<Pill size={19} />}
          span={2}
          action={
            <>
              <Segmented options={tabOptions} value={tab} onChange={setTab} />
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                Add
              </Button>
            </>
          }
        >
          {tab === "today" && (
            <>
              <div className="med-timeline">
                {medications.map((m) => (
                  <div className={`mt-row ${m.taken ? "taken" : m.id === medications.length - 1 ? "next" : ""}`} key={m.id}>
                    <div className="mt-time">
                      <strong>{m.time}</strong>
                      <em>{m.period}</em>
                    </div>
                    <div className="mt-marker">
                      <span style={{ background: m.color }} />
                      <i />
                    </div>
                    <div className="mt-body">
                      <div className="mt-head">
                        <strong>{m.name}</strong>
                        <Badge tone={m.taken ? "good" : m.id === medications.length - 1 ? "warn" : "neutral"} dot={m.taken}>
                          {m.taken ? `Taken at ${m.takenAt}` : m.id === medications.length - 1 ? "Due soon" : "Scheduled"}
                        </Badge>
                      </div>
                      <p>
                        {m.dose} · {m.type}
                        {m.withFood ? " · Take after food" : " · Take with water"}
                      </p>
                      <div className="mt-stock">
                        <ProgressBar value={m.remaining} max={30} tone={m.remaining < 10 ? "danger" : "primary"} />
                        <span>{m.remaining} capsules left</span>
                      </div>
                    </div>
                    <div className="mt-actions">
                      <button
                        className={`take-btn ${m.taken ? "on" : ""}`}
                        onClick={() => {
                          markMedication(m.id);
                          pushToast(
                            m.taken ? `${m.name} marked as not taken` : `${m.name} marked as taken`,
                            m.taken ? "info" : "good"
                          );
                        }}
                      >
                        {m.taken ? <Check size={16} /> : <Pill size={16} />}
                        {m.taken ? "Taken" : "Mark taken"}
                      </button>
                      <button
                        className="ghost-btn"
                        onClick={() => pushToast(`Reminder sent for ${m.name}`, "info")}
                        aria-label={`Remind about ${m.name}`}
                      >
                        <Bell size={15} />
                      </button>
                      <button
                        className="ghost-btn"
                        onClick={() => pushToast(`Voice prompt played for ${m.name}`, "good")}
                        aria-label={`Play voice prompt for ${m.name}`}
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {nextMed && (
                <div className="next-dose">
                  <Clock size={16} />
                  <span>
                    Next dose: <strong>{nextMed.name}</strong> at <strong>{nextMed.time}</strong>
                  </span>
                  <Button variant="primary" size="sm" onClick={() => pushToast("Reminder set for 8:00 PM", "good")}>
                    Set reminder
                  </Button>
                </div>
              )}
            </>
          )}

          {tab === "week" && (
            <>
              <div className="ring-row">
                <RingGauge
                  value={adherencePct}
                  size={170}
                  tone={adherencePct >= 90 ? "good" : adherencePct >= 70 ? "warn" : "danger"}
                  label="this week"
                  sublabel="28 of 30 doses"
                />
                <DonutChart
                  size={170}
                  centerValue="6"
                  centerLabel="missed"
                  segments={[
                    { label: "Taken", value: 28, color: "var(--c-good)" },
                    { label: "Missed", value: 2, color: "var(--c-danger)" },
                  ]}
                />
                <div className="ring-side">
                  <div className="kpi-strip tight col">
                    <div>
                      <span>Best streak</span>
                      <strong>9 days</strong>
                    </div>
                    <div>
                      <span>Missed (7d)</span>
                      <strong>{missed}</strong>
                    </div>
                    <div>
                      <span>Avg dose time</span>
                      <strong>8:04 AM</strong>
                    </div>
                    <div>
                      <span>On-time rate</span>
                      <strong>88%</strong>
                    </div>
                  </div>
                </div>
              </div>
              <BarChart
                labels={adherence.labels}
                series={adherence.series}
                height={220}
                max={100}
                unit="%"
                showValues
              />
            </>
          )}

          {tab === "stock" && (
            <div className="stock-list">
              {inventory.map((m) => (
                <div className="stock-row" key={m.name}>
                  <span className="sk-ico">
                    <Package size={17} />
                  </span>
                  <div className="sk-body">
                    <strong>{m.name}</strong>
                    <ProgressBar
                      value={m.left}
                      max={m.total}
                      tone={m.left < 10 ? "danger" : m.left < 18 ? "warn" : "primary"}
                    />
                    <em>
                      {m.left} of {m.total} remaining
                    </em>
                  </div>
                  <Badge tone={m.left < 10 ? "danger" : m.left < 18 ? "warn" : "good"}>{m.refill}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw size={13} />}
                    onClick={() => pushToast(`Refill ordered for ${m.name}`, "good")}
                  >
                    Refill
                  </Button>
                </div>
              ))}
              <div className="note-box">
                <AlertTriangle size={15} />
                <p>Atorvastatin runs out in 3 days. CareGuard will order a refill automatically if not confirmed.</p>
              </div>
            </div>
          )}
        </Card>

        <Card title="Adherence Today" subtitle="Dose completion" icon={<Pill size={19} />}>
          <div className="ring-row col">
            <DonutChart
              size={175}
              centerValue={`${adherencePct}%`}
              centerLabel="adherence"
              segments={[
                { label: "Taken", value: medsTaken, color: "var(--c-good)" },
                { label: "Pending", value: medications.length - medsTaken, color: "var(--c-warn)" },
              ]}
            />
            <div className="donut-legend">
              {[
                { l: "Taken", v: medsTaken, c: "var(--c-good)" },
                { l: "Pending", v: medications.length - medsTaken, c: "var(--c-warn)" },
              ].map((s) => (
                <span key={s.l}>
                  <i style={{ background: s.c }} /> {s.l}: {s.v}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Refill Forecast" subtitle="Next 30 days" icon={<RefreshCw size={19} />}>
          <div className="refill-list">
            {[
              { n: "Atorvastatin 10mg", d: "3 days", t: "danger" },
              { n: "Vitamin D3", d: "6 days", t: "warn" },
              { n: "Metformin 500mg", d: "9 days", t: "warn" },
              { n: "Amlodipine 5mg", d: "12 days", t: "good" },
            ].map((r) => (
              <div className="refill-row" key={r.n}>
                <span className={`rf-dot tone-${r.t}`} />
                <strong>{r.n}</strong>
                <em>{r.d}</em>
              </div>
            ))}
          </div>
          <Button
            variant="primary"
            full
            icon={<RefreshCw size={15} />}
            onClick={() => pushToast("Refill request sent to pharmacy", "good")}
          >
            Order refills now
          </Button>
        </Card>

        <Card title="Smart Reminders" subtitle="How doses are announced" icon={<Bell size={19} />}>
          <div className="reminder-list">
            {[
              { t: "5 minutes before", d: "Gentle chime on the watch", on: true },
              { t: "At dose time", d: "Voice prompt in Malayalam", on: true },
              { t: "15 min after", d: "Caregiver nudge to Aryaa", on: true },
              { t: "30 min after", d: "Escalate to Rohit", on: false },
            ].map((r) => (
              <div className="rem-row" key={r.t}>
                <span className={`rem-ico ${r.on ? "on" : ""}`}>{r.on ? <Check size={14} /> : null}</span>
                <div>
                  <strong>{r.t}</strong>
                  <em>{r.d}</em>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Interaction Checker" subtitle="Current medication list" icon={<AlertTriangle size={19} />}>
          <div className="inter-list">
            {interactions.map((i) => (
              <div className="inter-row" key={`${i.a}-${i.b}`}>
                <span className={`in-dot tone-${i.tone}`} />
                <div>
                  <strong>
                    {i.a} + {i.b}
                  </strong>
                  <em>{i.note}</em>
                </div>
                <Badge tone={i.tone}>{i.tone === "warn" ? "Monitor" : "Safe"}</Badge>
              </div>
            ))}
          </div>
          <p className="ps-note">
            Automated checks only. Always confirm with a pharmacist or doctor before changing a
            medication routine.
          </p>
        </Card>

        <Card title="Pharmacy" subtitle="Linked provider" icon={<Package size={19} />}>
          <div className="pharm">
            <div className="ph-head">
              <span className="ph-ico">
                <Package size={20} />
              </span>
              <div>
                <strong>Carewell Pharmacy</strong>
                <em>MG Road, Kochi · 1.2 km away</em>
              </div>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span>Phone</span>
                <strong>+91 484 220 9911</strong>
              </div>
              <div className="detail-row">
                <span>Hours</span>
                <strong>8:00 AM – 10:00 PM</strong>
              </div>
              <div className="detail-row">
                <span>Delivery</span>
                <strong>Same day, 2 hours</strong>
              </div>
            </div>
            <Button variant="ghost" full onClick={() => pushToast("Calling Carewell Pharmacy…", "info")}>
              Contact pharmacy
            </Button>
          </div>
        </Card>

        <Card title="Medication History" subtitle="Recent changes" icon={<CalendarClock size={19} />} span={2}>
          <div className="hist-list">
            {[
              { d: "Aug 20", t: "Atorvastatin dose reduced", w: "Dr. Meera Nair", tone: "info" },
              { d: "Aug 02", t: "Vitamin D3 added", w: "Dr. Meera Nair", tone: "good" },
              { d: "Jul 15", t: "Metformin timing changed to after food", w: "Pharmacy", tone: "warn" },
              { d: "Jun 28", t: "Amlodipine refilled", w: "Carewell Pharmacy", tone: "neutral" },
            ].map((h) => (
              <div className="hist-row" key={h.d}>
                <span className={`hs-dot tone-${h.tone}`} />
                <div>
                  <strong>{h.t}</strong>
                  <em>{h.w}</em>
                </div>
                <span className="hs-date">{h.d}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add medication"
        subtitle="The senior or a caregiver can add this"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAddOpen(false);
                pushToast("Medication added to schedule", "good");
              }}
            >
              Add medication
            </Button>
          </>
        }
      >
        <div className="zone-form">
          <label>
            Medication name
            <input defaultValue="Amlodipine 5mg" />
          </label>
          <label>
            Dose
            <input defaultValue="1 tablet" />
          </label>
          <label>
            Times
            <div className="radius-opts">
              {["8:00 AM", "1:00 PM", "6:00 PM", "8:00 PM"].map((t, i) => (
                <button key={t} className={i === 0 ? "on" : ""}>
                  {t}
                </button>
              ))}
            </div>
          </label>
          <label className="switch-row">
            <input type="checkbox" defaultChecked />
            Repeat daily
          </label>
          <label className="switch-row">
            <input type="checkbox" />
            Remind 5 minutes before
          </label>
        </div>
      </Modal>
    </div>
  );
}
