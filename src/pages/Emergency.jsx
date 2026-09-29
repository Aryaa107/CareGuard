import { useState } from "react";
import {
  Ambulance,
  FileText,
  HeartPulse,
  MapPin,
  Phone,
  PhoneCall,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { Badge, Button, Card, DetailRow, Modal, Toggle } from "../components/UI";
import { useCare } from "../context/careContext";

const incidents = [
  {
    id: 1,
    date: "Aug 12, 2026",
    time: "7:42 AM",
    type: "SOS Button",
    status: "Resolved",
    detail: "User pressed SOS. Contacted after 40 seconds. No injury.",
    resolvedIn: "3m 20s",
  },
  {
    id: 2,
    date: "Jul 28, 2026",
    time: "3:18 PM",
    type: "Fall Detection",
    status: "False Alarm",
    detail: "Device slipped from wrist while bathing. No incident.",
    resolvedIn: "1m 05s",
  },
  {
    id: 3,
    date: "Jul 03, 2026",
    time: "11:55 PM",
    type: "Wandering",
    status: "Resolved",
    detail: "Left home at night. Aryaa reached her at the neighbour's house.",
    resolvedIn: "8m 40s",
  },
  {
    id: 4,
    date: "Jun 19, 2026",
    time: "9:10 AM",
    type: "Health Alert",
    status: "Resolved",
    detail: "Blood pressure 152/96 sustained over 3 readings. Ambulance advised.",
    resolvedIn: "12m 15s",
  },
];

export default function Emergency() {
  const {
    senior,
    sosState,
    startSos,
    settings,
    updateSetting,
    pushToast,
    emergencyContacts,
    medicalProfile,
  } = useCare();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="page">
      <div className="sos-panel">
        <div className="sos-left">
          <h2>Emergency SOS</h2>
          <p>
            Hold the button for {settings.sosHoldSeconds} seconds to alert your emergency
            contacts. You can cancel any time before it sends.
          </p>
          <div className="sos-chips">
            <span>
              <Phone size={14} /> {emergencyContacts.length} contacts will be called in order
            </span>
            <span>
              <MapPin size={14} /> Live location attached
            </span>
            <span>
              <FileText size={14} /> Medical profile shared
            </span>
          </div>
        </div>

        <button
          className={`sos-hold ${sosState.active ? "holding" : ""}`}
          onPointerDown={startSos}
          title="Press and hold to send SOS"
        >
          <span className="sos-ring">
            <Siren size={40} />
          </span>
          <strong>{sosState.active ? "Sending…" : "HOLD FOR SOS"}</strong>
          <em>Press and hold</em>
        </button>
      </div>

      <div className="grid main-grid">
        <Card title="Quick Dial" subtitle="One tap connects you" icon={<Phone size={19} />}>
          <div className="dial-list">
            {emergencyContacts.map((c) => (
              <button
                key={c.id}
                className={`dial-row ${c.primary ? "primary" : ""}`}
                onClick={() => pushToast(`Calling ${c.name}…`, "info")}
              >
                <span className="dr-ico">
                  {c.number === "112" ? <Ambulance size={17} /> : <PhoneCall size={17} />}
                </span>
                <div className="dr-body">
                  <strong>{c.name}</strong>
                  <em>
                    {c.relation} · {c.number}
                  </em>
                </div>
                {c.primary && <Badge tone="danger">Primary</Badge>}
                <Phone size={17} className="dr-call" />
              </button>
            ))}
          </div>
          <div className="dial-note">
            <ShieldCheck size={15} />
            <p>Calls are recorded and the timestamp is added to the incident log.</p>
          </div>
        </Card>

        <Card
          title="Medical Profile"
          subtitle="Shared automatically on SOS"
          icon={<FileText size={19} />}
          action={
            <Button variant="link" size="sm" onClick={() => setProfileOpen(true)}>
              Full profile
            </Button>
          }
        >
          <div className="detail-list">
            {medicalProfile.slice(0, 4).map((m) => (
              <DetailRow key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          <div className="allergy-box">
            <span>Allergies</span>
            <div>
              {senior.allergies.map((a) => (
                <Badge tone="danger" key={a}>
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Escalation Chain" subtitle="Who gets called, in order" icon={<Users size={19} />}>
          <div className="escalation">
            {[
              { n: 1, name: "Aryaa Menon", role: "Daughter", wait: "0s", state: "ready" },
              { n: 2, name: "Rohit Menon", role: "Son", wait: "+30s", state: "ready" },
              { n: 3, name: "Suresh Kumar", role: "Trusted neighbour", wait: "+60s", state: "ready" },
              { n: 4, name: "City Emergency (112)", role: "Ambulance + Police", wait: "+120s", state: "auto" },
            ].map((s) => (
              <div className="esc-row" key={s.n}>
                <span className="esc-n">{s.n}</span>
                <div className="esc-body">
                  <strong>{s.name}</strong>
                  <em>{s.role}</em>
                </div>
                <span className="esc-wait">{s.wait}</span>
                <Badge tone={s.state === "auto" ? "warn" : "good"}>
                  {s.state === "auto" ? "Automatic" : "Ready"}
                </Badge>
              </div>
            ))}
          </div>
          <p className="esc-note">
            If no contact confirms within 120 seconds, CareGuard automatically calls 112 and
            shares live location and medical profile.
          </p>
        </Card>

        <Card title="Emergency Preferences" subtitle="How SOS behaves" icon={<ShieldCheck size={19} />} className="full-card">
          <div className="toggle-list">
            <Toggle
              label="Auto-call ambulance"
              hint="Call 112 automatically after escalation"
              checked={settings.callAmbulance}
              onChange={(v) => updateSetting("callAmbulance", v)}
            />
            <Toggle
              label="SMS backup"
              hint="Send SMS if calls go unanswered"
              checked={settings.notifySms}
              onChange={(v) => updateSetting("notifySms", v)}
            />
            <Toggle
              label="Push notification"
              hint="Instant alert on all caregiver devices"
              checked={settings.notifyPush}
              onChange={(v) => updateSetting("notifyPush", v)}
            />
            <Toggle
              label="Geofence alerts"
              hint="Alert when leaving a safe zone"
              checked={settings.geofenceAlerts}
              onChange={(v) => updateSetting("geofenceAlerts", v)}
            />
          </div>
          <div className="hold-setting">
            <span>Hold duration before sending</span>
            <div className="hold-opts">
              {[0, 3, 5, 8].map((s) => (
                <button
                  key={s}
                  className={settings.sosHoldSeconds === s ? "on" : ""}
                  onClick={() => updateSetting("sosHoldSeconds", s)}
                >
                  {s === 0 ? "Instant" : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="Incident History"
          subtitle="4 events recorded"
          icon={<FileText size={19} />}
          className="full-card"
        >
          <div className="incident-table">
            <div className="it-head">
              <span>Date</span>
              <span>Type</span>
              <span>Detail</span>
              <span>Resolved in</span>
              <span>Status</span>
            </div>
            {incidents.map((i) => (
              <div className="it-row" key={i.id}>
                <span className="it-date">
                  <strong>{i.date}</strong>
                  <em>{i.time}</em>
                </span>
                <span>
                  <Badge tone={i.type === "Fall Detection" ? "warn" : i.type === "SOS Button" ? "danger" : "info"}>
                    {i.type}
                  </Badge>
                </span>
                <span className="it-detail">{i.detail}</span>
                <span className="it-time">{i.resolvedIn}</span>
                <span>
                  <Badge tone={i.status === "False Alarm" ? "neutral" : "good"} dot>
                    {i.status}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>


      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        wide
        title="Full medical profile"
        subtitle="This is exactly what an emergency responder sees"
        footer={
          <Button variant="primary" onClick={() => setProfileOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="profile-sheet">
          <div className="ps-head">
            <div className="ps-avatar">{senior.photo}</div>
            <div>
              <h4>{senior.name}</h4>
              <p>
                {senior.age} years · {senior.bloodGroup} · Emergency contact {senior.emergencyContact}
              </p>
            </div>
          </div>

          <div className="ps-grid">
            <div className="ps-col">
              <h5>
                <HeartPulse size={15} /> Vitals now
              </h5>
              <DetailRow label="Heart rate" value="76 BPM" />
              <DetailRow label="Blood pressure" value="118/76" />
              <DetailRow label="Blood oxygen" value="98%" />
              <DetailRow label="Blood sugar" value="112 mg/dL" />
              <DetailRow label="Temperature" value="36.7 °C" />
            </div>
            <div className="ps-col">
              <h5>
                <FileText size={15} /> Medical history
              </h5>
              {senior.conditions.map((c) => (
                <div className="ps-tag" key={c}>
                  {c}
                </div>
              ))}
              <h5 className="spaced">
                <Siren size={15} /> Allergies
              </h5>
              {senior.allergies.map((a) => (
                <div className="ps-tag danger" key={a}>
                  {a}
                </div>
              ))}
            </div>
            <div className="ps-col">
              <h5>
                <Users size={15} /> Contacts & care
              </h5>
              {medicalProfile.map((m) => (
                <DetailRow key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
