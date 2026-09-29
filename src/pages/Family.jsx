import { useState } from "react";
import {
  CheckSquare,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Modal, ProgressBar } from "../components/UI";
import { useCare } from "../context/careContext";
import { addCaregiver } from "../services/dataService";

const sharedTasks = [
  { id: 1, t: "Order Metformin refill", who: "Aryaa", due: "Today", done: false },
  { id: 2, t: "Accompany to cardiology review", who: "Rohit", due: "Aug 30", done: false },
  { id: 3, t: "Record blood pressure log", who: "Aryaa", due: "Daily", done: true },
  { id: 4, t: "Call on Sunday evening", who: "Neha", due: "Aug 29", done: false },
  { id: 5, t: "Replace bathroom grab bar", who: "Rohit", due: "Sep 02", done: false },
  { id: 6, t: "Update medical profile", who: "Aryaa", due: "Aug 20", done: true },
];

const visits = [
  { d: "Sun 30", t: "Cardiology review", p: "Aster Medical Centre", w: "Rohit" },
  { d: "Wed 02", t: "Blood test — fasting", p: "Carewell Diagnostics", w: "Aryaa" },
  { d: "Fri 05", t: "Physiotherapy session", p: "Home visit", w: "Neha" },
];

const perms = [
  { k: "Health", kd: "Vitals, trends, medication", am: true, rm: true, nm: false, sk: false },
  { k: "Location", kd: "Live position and history", am: true, rm: false, nm: false, sk: true },
  { k: "SOS", kd: "Receive emergency alerts", am: true, rm: true, nm: true, sk: true },
  { k: "Calls", kd: "Call and video with Sarala", am: true, rm: true, nm: true, sk: false },
  { k: "Tasks", kd: "Create and assign care tasks", am: true, rm: true, nm: false, sk: false },
  { k: "Settings", kd: "Change app configuration", am: true, rm: false, nm: false, sk: false },
];

export default function Family() {
  const { pushToast, careTeam, activeProfileId, refresh } = useCare();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", phone: "", role: "Co-caregiver" });
  const [inviting, setInviting] = useState(false);
  const [tasks, setTasks] = useState(sharedTasks);

  const toggleTask = (id) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const openRate = 78;

  /** Writes the new member through the API, then reloads the bundle. */
  const sendInvite = async () => {
    if (!invite.name.trim()) {
      pushToast("Enter a name to send an invite", "danger");
      return;
    }
    setInviting(true);
    try {
      await addCaregiver(activeProfileId, {
        name: invite.name.trim(),
        phone: invite.phone.trim(),
        role: invite.role,
        relation: "Family",
      });
      await refresh();
      setInviteOpen(false);
      setInvite({ name: "", phone: "", role: "Co-caregiver" });
      pushToast("Invitation sent", "good");
    } catch (err) {
      pushToast(err?.message || "Could not send the invite", "danger");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="page">
      <div className="grid main-grid">
        <Card
          title="Care Circle"
          subtitle={`${careTeam.length} member${careTeam.length === 1 ? "" : "s"} with access`}
          icon={<Users size={19} />}
          span={2}
          action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setInviteOpen(true)}>
              Invite member
            </Button>
          }
        >
          <div className="member-grid">
            {careTeam.map((m) => (
              <div className="member-card" key={m.id}>
                <div className="mc-top">
                  <span className="mc-avatar">{m.avatar}</span>
                  <span className={`mc-status ${m.status}`} />
                </div>
                <strong>{m.name}</strong>
                <em>{m.relation}</em>
                <Badge tone={m.status === "online" ? "good" : m.status === "away" ? "warn" : "neutral"}>
                  {m.lastSeen}
                </Badge>
                <div className="mc-perms">
                  {m.access.map((a) => (
                    <span key={a}>{a}</span>
                  ))}
                </div>
                <div className="mc-actions">
                  <button onClick={() => pushToast(`Calling ${m.name}…`, "info")} aria-label={`Call ${m.name}`}>
                    <Phone size={15} />
                  </button>
                  <button onClick={() => pushToast(`Message sent to ${m.name}`, "good")} aria-label={`Message ${m.name}`}>
                    <MessageSquare size={15} />
                  </button>
                  <button onClick={() => pushToast(`Video call started with ${m.name}`, "info")} aria-label={`Video call ${m.name}`}>
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Care Circle Health" subtitle="Team participation" icon={<ShieldCheck size={19} />}>
          <div className="circle-score">
            <div className="cs-ring">
              <strong>92</strong>
              <span>score</span>
            </div>
            <div className="cs-side">
              {[
                { l: "Alert response rate", v: 100, t: "good" },
                { l: "Check-ins completed", v: 86, t: "info" },
                { l: "Task completion", v: 74, t: "warn" },
              ].map((r) => (
                <ProgressBar key={r.l} value={r.v} tone={r.t} label={r.l} right={`${r.v}%`} />
              ))}
            </div>
          </div>
          <p className="ps-note">
            Every SOS alert was acknowledged by at least one member within 30 seconds this month.
          </p>
        </Card>

        <Card
          title="Shared Care Tasks"
          subtitle={`${tasks.filter((t) => t.done).length} of ${tasks.length} done`}
          icon={<CheckSquare size={19} />}
          span={2}
          action={
            <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => pushToast("New task created", "good")}>
              New task
            </Button>
          }
        >
          <div className="task-list">
            {tasks.map((t) => (
              <button className={`task-row ${t.done ? "done" : ""}`} key={t.id} onClick={() => toggleTask(t.id)}>
                <span className="tk-box">{t.done ? "✓" : ""}</span>
                <span className="tk-body">
                  <strong>{t.t}</strong>
                  <em>Assigned to {t.who}</em>
                </span>
                <span className="tk-due">
                  <Clock size={13} /> {t.due}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Upcoming Visits" subtitle="Next 7 days" icon={<CalendarIcon />}>
          <div className="visit-list">
            {visits.map((v) => (
              <div className="visit-row" key={v.d}>
                <span className="vd-date">{v.d}</span>
                <div>
                  <strong>{v.t}</strong>
                  <em>
                    {v.p} · {v.w}
                  </em>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Access Permissions" subtitle="Who can see what" icon={<ShieldCheck size={19} />} className="full-card">
          <div className="perm-table">
            <div className="pt-head">
              <span>Permission</span>
              <span>Description</span>
              <span>Aryaa</span>
              <span>Rohit</span>
              <span>Neha</span>
              <span>Suresh</span>
            </div>
            {perms.map((p) => (
              <div className="pt-row" key={p.k}>
                <span className="pt-name">{p.k}</span>
                <span className="pt-desc">{p.kd}</span>
                {[p.am, p.rm, p.nm, p.sk].map((on, i) => (
                  <span key={i} className={`pt-cell ${on ? "on" : "off"}`}>
                    {on ? "✓" : "—"}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Communication Log" subtitle="Recent contact" icon={<MessageSquare size={19} />} span={2}>
          <div className="comms">
            <div className="kpi-strip tight col">
              <div>
                <span>Calls this week</span>
                <strong>12</strong>
              </div>
              <div>
                <span>Avg duration</span>
                <strong>6m 40s</strong>
              </div>
              <div>
                <span>Video sessions</span>
                <strong>4</strong>
              </div>
              <div>
                <span>Missed by senior</span>
                <strong>1</strong>
              </div>
            </div>
            <Button variant="ghost" full onClick={() => pushToast("Weekly call schedule opened", "info")}>
              Manage call schedule
            </Button>
          </div>
        </Card>

        <Card title="Notification Reach" subtitle="Delivery rates" icon={<Mail size={19} />}>
          <div className="reach">
            {[
              { l: "Push", v: 100, t: "good" },
              { l: "SMS", v: 92, t: "good" },
              { l: "Email", v: 78, t: "info" },
              { l: "Voice call", v: 100, t: "good" },
            ].map((r) => (
              <ProgressBar key={r.l} value={r.v} tone={r.t} label={r.l} right={`${r.v}%`} />
            ))}
            <p className="ps-note">
              Average delivery across the care circle this month is <strong>{openRate}%</strong>.
            </p>
          </div>
        </Card>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite to care circle"
        subtitle="They'll get an SMS with a secure sign-in link"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={sendInvite}
              disabled={inviting}
            >
              {inviting ? "Sending…" : "Send invite"}
            </Button>
          </>
        }
      >
        <div className="zone-form">
          <label>
            Full name
            <input
              value={invite.name}
              onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
              placeholder="Meera Menon"
            />
          </label>
          <label>
            Mobile number
            <input
              value={invite.phone}
              onChange={(e) => setInvite((v) => ({ ...v, phone: e.target.value }))}
              placeholder="+91 98450 00000"
            />
          </label>
          <label>
            Access level
            <div className="radius-opts">
              {["Viewer", "Co-caregiver", "Primary"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={invite.role === r ? "on" : ""}
                  onClick={() => setInvite((v) => ({ ...v, role: r }))}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>
          <label className="switch-row">
            <input type="checkbox" defaultChecked />
            Grant emergency alert access
          </label>
          <label className="switch-row">
            <input type="checkbox" defaultChecked />
            Grant live location access
          </label>
        </div>
      </Modal>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
