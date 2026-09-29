import { useState } from "react";
import {
  Accessibility,
  Bell,
  Database,
  Eye,
  Moon,
  Phone,
  ShieldCheck,
  Sliders,
  Trash2,
  Type,
  Watch,
} from "lucide-react";
import { Badge, Button, Card, DetailRow, Segmented, Toggle } from "../components/UI";
import { useCare } from "../context/careContext";

const exportData = {
  title: "Your data",
  body: "Download a copy of everything CareGuard holds: health records, medication history, location history and alert logs. The file is a portable JSON archive you can share with any doctor.",
};

export default function Settings() {
  const { settings, updateSetting, nightMode, setNightMode, pushToast, senior, live } = useCare();
  const [tab, setTab] = useState("access");

  const tabs = [
    { id: "access", label: "Accessibility" },
    { id: "alerts", label: "Alerts" },
    { id: "safety", label: "Safety" },
    { id: "device", label: "Devices" },
    { id: "data", label: "Data & Privacy" },
  ];

  return (
    <div className="page">
      <div className="settings-tabs">
        <Segmented options={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === "access" && (
        <div className="grid main-grid">
          <Card
            title="Accessibility"
            subtitle="Make CareGuard easier to read and use"
            icon={<Accessibility size={19} />}
            span={2}
          >
            <div className="toggle-list">
              <div className="setting-preview">
                <span>Preview</span>
                <p style={{ fontSize: `${1 * settings.textScale}rem` }}>
                  Heart rate 76 BPM — normal range. Sarala is safe at home.
                </p>
              </div>

              <div className="scale-row">
                <span className="scale-label">
                  <Type size={16} /> Text size
                </span>
                <div className="scale-btns">
                  {["Small", "Normal", "Large", "Extra Large"].map((s, i) => {
                    const values = [0.9, 1, 1.15, 1.35];
                    return (
                      <button
                        key={s}
                        className={Math.abs(settings.textScale - values[i]) < 0.03 ? "on" : ""}
                        onClick={() => updateSetting("textScale", values[i])}
                        style={{ fontSize: `${0.72 + i * 0.06}rem` }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Toggle
                label="High contrast mode"
                hint="Stronger borders and darker text for low vision"
                checked={settings.highContrast}
                onChange={(v) => updateSetting("highContrast", v)}
              />
              <Toggle
                label="Reduce motion"
                hint="Turns off animated transitions and pulse effects"
                checked={settings.reduceMotion}
                onChange={(v) => updateSetting("reduceMotion", v)}
              />
              <Toggle
                label="Voice assist"
                hint="Reads the senior view out loud automatically"
                checked={settings.voiceAssist}
                onChange={(v) => updateSetting("voiceAssist", v)}
              />
              <Toggle
                label="Night mode"
                hint="Darker palette for low-light rooms"
                checked={nightMode}
                onChange={setNightMode}
              />
            </div>
          </Card>

          <Card title="Senior View" subtitle="Simplified, large-target layout" icon={<Eye size={19} />}>
            <p className="ps-note">
              The senior view is designed for {senior.shortName} to use directly. It has only four
              large buttons, plain language and no dense data.
            </p>
            <ul className="feature-list">
              <li>
                <span>✓</span> One tap &ldquo;I am okay&rdquo;
              </li>
              <li>
                <span>✓</span> Large medicine reminders
              </li>
              <li>
                <span>✓</span> Spoken prompts
              </li>
              <li>
                <span>✓</span> No scrolling required
              </li>
            </ul>
            <Button variant="primary" full onClick={() => pushToast("Open Senior View from the sidebar", "info")}>
              Open senior view
            </Button>
          </Card>

          <Card title="Keyboard & Input" subtitle="Navigation help" icon={<Sliders size={19} />} className="full-card">
            <div className="detail-list">
              <DetailRow label="Focus visible" value="Always" />
              <DetailRow label="Minimum tap target" value="48 × 48 px" />
              <DetailRow label="Shortcut: SOS page" value="Alt + E" />
              <DetailRow label="Shortcut: Search" value="Ctrl + K" />
              <DetailRow label="Screen reader" value="Labels provided" />
            </div>
          </Card>
        </div>
      )}

      {tab === "alerts" && (
        <div className="grid main-grid">
          <Card title="Notification Channels" subtitle="How alerts reach you" icon={<Bell size={19} />} span={2}>
            <div className="toggle-list">
              <Toggle
                label="Push notifications"
                hint="Instant alerts on this device"
                checked={settings.notifyPush}
                onChange={(v) => updateSetting("notifyPush", v)}
              />
              <Toggle
                label="SMS backup"
                hint="If push is not opened within 60 seconds"
                checked={settings.notifySms}
                onChange={(v) => updateSetting("notifySms", v)}
              />
              <Toggle
                label="Voice call escalation"
                hint="Calls instead of text for critical alerts"
                checked={settings.callAmbulance}
                onChange={(v) => updateSetting("callAmbulance", v)}
              />
              <Toggle
                label="Quiet hours"
                hint="8:00 PM – 7:00 AM, emergencies always break through"
                checked={settings.quietHours}
                onChange={(v) => updateSetting("quietHours", v)}
              />
              <Toggle
                label="Weekly report"
                subtitle="Every Sunday at 8:00 PM"
                checked={settings.weeklyReports}
                onChange={(v) => updateSetting("weeklyReports", v)}
              />
            </div>
          </Card>

          <Card title="Alert Thresholds" subtitle="When to notify" icon={<Sliders size={19} />}>
            <div className="detail-list">
              <DetailRow label="Heart rate high" value="Above 100 BPM" />
              <DetailRow label="Heart rate low" value="Below 50 BPM" />
              <DetailRow label="Blood oxygen" value="Below 94%" />
              <DetailRow label="Blood pressure" value="Above 140/90" />
              <DetailRow label="Blood sugar" value="Above 180 mg/dL" />
              <DetailRow label="Temperature" value="Above 38.0 °C" />
              <DetailRow label="Inactivity" value="90 min in daytime" />
              <DetailRow label="Missed medication" value="30 min after dose" />
            </div>
            <Button variant="ghost" full onClick={() => pushToast("Threshold editor opened", "info")}>
              Customise thresholds
            </Button>
          </Card>

          <Card title="Recipients" subtitle="Who gets which alerts" icon={<Phone size={19} />} className="full-card">
            {[
              { n: "Aryaa Menon", r: "All alerts + SOS", on: true },
              { n: "Rohit Menon", r: "Critical + SOS", on: true },
              { n: "Neha Menon", r: "Daily summary only", on: false },
              { n: "Suresh Kumar", r: "SOS only", on: true },
            ].map((p) => (
              <div className="recip-row" key={p.n}>
                <span className="rp-avatar">{p.n.split(" ").map((x) => x[0]).join("")}</span>
                <div>
                  <strong>{p.n}</strong>
                  <em>{p.r}</em>
                </div>
                <Badge tone={p.on ? "good" : "neutral"} dot={p.on}>
                  {p.on ? "On" : "Off"}
                </Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "safety" && (
        <div className="grid main-grid">
          <Card title="Monitoring" subtitle="What CareGuard watches" icon={<ShieldCheck size={19} />} span={2}>
            <div className="toggle-list">
              <Toggle
                label="Fall detection"
                hint="Uses accelerometer and gyro on the watch"
                checked
                onChange={() => pushToast("Fall detection cannot be disabled while SOS is active", "info")}
              />
              <Toggle
                label="Inactivity alerts"
                hint="Warns after long daytime stillness"
                checked
                onChange={() => pushToast("Inactivity alerts are required by the safety policy", "info")}
              />
              <Toggle
                label="Geofence alerts"
                hint="Leaving Home, Temple or Market zones"
                checked={settings.geofenceAlerts}
                onChange={(v) => updateSetting("geofenceAlerts", v)}
              />
              <Toggle
                label="Night wandering detection"
                hint="Movement outside Home between 11 PM and 5 AM"
                checked
                onChange={() => pushToast("Night wandering detection updated", "good")}
              />
            </div>
            <div className="scale-row">
              <span className="scale-label">
                <ShieldCheck size={16} /> Fall sensitivity
              </span>
              <Segmented
                options={[
                  { id: "Low", label: "Low" },
                  { id: "Balanced", label: "Balanced" },
                  { id: "High", label: "High" },
                ]}
                value={settings.fallSensitivity}
                onChange={(v) => updateSetting("fallSensitivity", v)}
              />
            </div>
          </Card>

          <Card title="Backup Contacts" subtitle="Escalation order" icon={<Phone size={19} />}>
            <div className="detail-list">
              <DetailRow label="1st" value="Aryaa Menon · +91 98450 22140" />
              <DetailRow label="2nd" value="Rohit Menon · +91 98450 77318" />
              <DetailRow label="3rd" value="Suresh Kumar · +91 98450 11902" />
              <DetailRow label="4th" value="City emergency · 112" />
            </div>
            <Button variant="ghost" full onClick={() => pushToast("Contact order editor opened", "info")}>
              Reorder contacts
            </Button>
          </Card>

          <Card title="Safety Checklist" subtitle="Home setup for seniors" icon={<ShieldCheck size={19} />} className="full-card">
            {[
              { l: "Bathroom grab bars installed", on: true },
              { l: "Night light in hallway", on: true },
              { l: "Non-slip mat near kitchen", on: true },
              { l: "Emergency button reachable from bed", on: true },
              { l: "Medicine box labelled", on: false },
            ].map((c) => (
              <div className="check-row" key={c.l}>
                <span className={`ck-box ${c.on ? "on" : ""}`}>{c.on ? "✓" : ""}</span>
                <span>{c.l}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "device" && (
        <div className="grid main-grid">
          <Card title="Connected Devices" subtitle="2 active" icon={<Watch size={19} />} span={2}>
            <div className="device-list">
              <div className="dev-card">
                <span className="dv-ico">
                  <Watch size={20} />
                </span>
                <div className="dv-body">
                  <strong>CareBand X2</strong>
                  <em>Worn by {senior.name} · SN CGX2-77451</em>
                  <div className="dv-meta">
                    <span>Battery {live.battery}%</span>
                    <span>4G strong</span>
                    <span>Firmware 4.2.1</span>
                  </div>
                </div>
                <Badge tone="good" dot>
                  Active
                </Badge>
              </div>
              <div className="dev-card">
                <span className="dv-ico">
                  <Database size={20} />
                </span>
                <div className="dv-body">
                  <strong>Home Hub</strong>
                  <em>Living room gateway · SN HH-22110</em>
                  <div className="dv-meta">
                    <span>Battery 24%</span>
                    <span>Wi-Fi strong</span>
                    <span>Firmware 2.9.0</span>
                  </div>
                </div>
                <Badge tone="warn" dot>
                  Charge
                </Badge>
              </div>
            </div>
          </Card>

          <Card title="This Device" subtitle="Caregiver phone" icon={<Sliders size={19} />}>
            <div className="detail-list">
              <DetailRow label="App version" value="3.2.0" />
              <DetailRow label="Notifications" value="Enabled" />
              <DetailRow label="Background sync" value="On" />
              <DetailRow label="Biometric lock" value="On" />
            </div>
            <Button variant="ghost" full onClick={() => pushToast("App updated to 3.2.0", "good")}>
              Check for updates
            </Button>
          </Card>

          <Card title="CareBand Charger" subtitle="Accessories" icon={<Database size={19} />} className="full-card">
            <p className="ps-note">A spare charging cradle is recommended so the watch is always available overnight.</p>
            <Button variant="ghost" full onClick={() => pushToast("Charging cradle ordered", "good")}>
              Order spare charger
            </Button>
          </Card>
        </div>
      )}

      {tab === "data" && (
        <div className="grid main-grid">
          <Card title="Data & Privacy" subtitle="You control everything" icon={<Database size={19} />} span={2}>
            <div className="data-hero">
              <span className="dh-ico">
                <Database size={26} />
              </span>
              <div>
                <h4>{exportData.title}</h4>
                <p>{exportData.body}</p>
              </div>
            </div>
            <div className="data-actions">
              <Button variant="primary" onClick={() => pushToast("Preparing your data archive…", "good")}>
                Download my data
              </Button>
              <Button variant="ghost" onClick={() => pushToast("Share settings opened", "info")}>
                Share with a doctor
              </Button>
            </div>
            <div className="detail-list">
              <DetailRow label="Health records" value="2,480 entries" />
              <DetailRow label="Location history" value="30 days retained" />
              <DetailRow label="Alert logs" value="412 events" />
              <DetailRow label="Encryption" value="AES-256, at rest and in transit" />
              <DetailRow label="Who can view" value="Care circle members you approve" />
            </div>
          </Card>

          <Card title="Danger Zone" subtitle="Irreversible actions" icon={<Trash2 size={19} />}>
            <p className="ps-note">
              Deleting the account removes all health, medication and location history for
              {senior.name} permanently. Export your data first.
            </p>
            <Button
              variant="danger"
              full
              icon={<Trash2 size={16} />}
              onClick={() => pushToast("Contact support to delete an account", "warn")}
            >
              Delete account
            </Button>
          </Card>

          <Card title="Legal" subtitle="Compliance" icon={<ShieldCheck size={19} />} className="full-card">
            <div className="detail-list">
              <DetailRow label="Terms of service" value="v4.1 · updated Jul 2026" />
              <DetailRow label="Privacy policy" value="v3.8 · updated Jul 2026" />
              <DetailRow label="Data residency" value="India (Mumbai region)" />
              <DetailRow label="Medical disclaimer" value="Not a medical device" />
            </div>
          </Card>
        </div>
      )}

      <div className="settings-foot">
        <Moon size={15} />
        <span>
          CareGuard supports older adults but is not a substitute for professional medical
          advice. In an emergency, always call 112.
        </span>
      </div>
    </div>
  );
}
