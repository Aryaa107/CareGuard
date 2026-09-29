import { useState } from "react";
import {
  Battery,
  Clock,
  Crosshair,
  Home,
  MapPin,
  Navigation,
  Plus,
  Share2,
  Wifi,
} from "lucide-react";
import { Badge, Button, Card, Icon, Modal, Toggle } from "../components/UI";
import { useCare } from "../context/careContext";

const buildings = [
  { x: 18, y: 30, w: 16, h: 20, label: "Block A" },
  { x: 40, y: 18, w: 22, h: 26, label: "Green Meadows" },
  { x: 68, y: 40, w: 18, h: 18, label: "Market" },
  { x: 24, y: 62, w: 20, h: 16, label: "Temple" },
  { x: 54, y: 64, w: 16, h: 14, label: "Park" },
];

const zoneCoords = { 1: [51, 31], 2: [34, 70], 3: [77, 49] };

export default function Location() {
  const { settings, updateSetting, pushToast, live, safeZones, locationHistory } = useCare();
  const [zoneOpen, setZoneOpen] = useState(false);
  const [sharing, setSharing] = useState(true);

  return (
    <div className="page">
      <div className="grid main-grid">
        <Card
          title="Live Map"
          subtitle="Simulated position · updated 2 minutes ago"
          icon={<MapPin size={19} />}
          className="map-card"
          span={2}
          action={
            <div className="map-actions">
              <Button variant="ghost" size="sm" icon={<Share2 size={14} />} onClick={() => pushToast("Location link copied", "good")}>
                Share
              </Button>
              <Button variant="ghost" size="sm" icon={<Crosshair size={14} />} onClick={() => pushToast("Map centred on Sarala", "info")}>
                Recentre
              </Button>
            </div>
          }
        >
          <div className="map">
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="map-svg" role="img" aria-label="Map showing Sarala's location at home">
              <defs>
                <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M8 0H0V8" fill="none" stroke="var(--map-line)" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="var(--map-bg)" />
              <rect width="100" height="100" fill="url(#grid)" />

              <path d="M0 52 H100" className="map-road main" />
              <path d="M36 0 V100" className="map-road" />
              <path d="M0 78 H100" className="map-road" />
              <path d="M64 0 V100" className="map-road thin" />

              {buildings.map((b) => (
                <g key={b.label}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} className="map-building" />
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 1} className="map-label" textAnchor="middle">
                    {b.label}
                  </text>
                </g>
              ))}

              {safeZones.map((z) => {
                const [cx, cy] = zoneCoords[z.id];
                return (
                  <g key={z.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={z.radius / 6}
                      className={`map-zone ${z.status === "inside" ? "inside" : ""}`}
                      style={{ stroke: z.color }}
                    />
                    <text x={cx} y={cy - z.radius / 6 - 2} className="map-zone-label" textAnchor="middle">
                      {z.name}
                    </text>
                  </g>
                );
              })}

              <g className="map-user">
                <circle cx="51" cy="31" r="6" className="map-pulse" style={{ transformOrigin: "51px 31px" }} />
                <circle cx="51" cy="31" r="2.4" className="map-dot-inner" />
                <text x="51" y="36.5" className="map-you" textAnchor="middle">
                  Sarala
                </text>
              </g>
            </svg>

            <div className="map-hud">
              <Badge tone="good" dot>
                Inside Home zone
              </Badge>
              <span>Accuracy ±8 m</span>
            </div>

            <div className="map-zoom">
              <button onClick={() => pushToast("Zoomed in", "info")} aria-label="Zoom in">+</button>
              <button onClick={() => pushToast("Zoomed out", "info")} aria-label="Zoom out">−</button>
            </div>
          </div>

          <div className="map-foot">
            <div>
              <Home size={16} />
              <span>
                <strong>Home</strong>
                Flat 4B, Green Meadows Apartments, Kochi, Kerala
              </span>
            </div>
            <div className="map-foot-badges">
              <span>
                <Wifi size={14} /> GPS strong
              </span>
              <span>
                <Battery size={14} /> {live.battery}%
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Safe Zones"
          subtitle="Geofence alerts"
          icon={<Home size={19} />}
          action={
            <Button variant="link" size="sm" icon={<Plus size={14} />} onClick={() => setZoneOpen(true)}>
              Add
            </Button>
          }
        >
          <div className="zone-list">
            {safeZones.map((z) => (
              <div className="zone-row" key={z.id}>
                <span className="z-dot" style={{ background: z.color }} />
                <div>
                  <strong>{z.name}</strong>
                  <em>{z.radius} m radius</em>
                </div>
                <Badge tone={z.status === "inside" ? "good" : "neutral"} dot={z.status === "inside"}>
                  {z.status === "inside" ? "Inside" : "Outside"}
                </Badge>
              </div>
            ))}
          </div>
          <div className="toggle-list tight">
            <Toggle
              label="Zone alerts"
              hint="Notify when Sarala leaves a zone"
              checked={settings.geofenceAlerts}
              onChange={(v) => updateSetting("geofenceAlerts", v)}
            />
            <Toggle
              label="Location sharing"
              hint="Visible to the care circle"
              checked={sharing}
              onChange={(v) => {
                setSharing(v);
                pushToast(v ? "Location sharing enabled" : "Location sharing paused", v ? "good" : "info");
              }}
            />
          </div>
        </Card>

        <Card title="Current Position" subtitle="Live device data" icon={<Navigation size={19} />}>
          <div className="detail-list">
            <div className="detail-row">
              <span>Latitude</span>
              <strong>9.9312° N</strong>
            </div>
            <div className="detail-row">
              <span>Longitude</span>
              <strong>76.2673° E</strong>
            </div>
            <div className="detail-row">
              <span>Place</span>
              <strong>Green Meadows, Block C</strong>
            </div>
            <div className="detail-row">
              <span>Accuracy</span>
              <strong>±8 metres</strong>
            </div>
            <div className="detail-row">
              <span>Battery</span>
              <strong>{live.battery}%</strong>
            </div>
            <div className="detail-row">
              <span>Last update</span>
              <strong>2 minutes ago</strong>
            </div>
          </div>
        </Card>

        <Card title="Place History" subtitle="Today" icon={<Clock size={19} />}>
          <div className="loc-history">
            {locationHistory.map((l, i) => (
              <div className="lh-row" key={i}>
                <span className="lh-ico">
                  <Icon name={l.icon} size={14} />
                </span>
                <strong>{l.place}</strong>
                <em>{l.time}</em>
                <span className="lh-dur">{l.duration}</span>
              </div>
            ))}
          </div>
          <Button variant="ghost" full onClick={() => pushToast("Full 30-day history opened", "info")}>
            View 30-day history
          </Button>
        </Card>

        <Card title="Battery & Tracking" subtitle="Device health" icon={<Battery size={19} />} span={2}>
          <div className="batt-ring">
            <div
              className="batt-bar"
              style={{ background: `conic-gradient(var(--c-good) ${live.battery}%, var(--c-neutral) 0)` }}
            >
              <div className="batt-inner">
                <strong>{live.battery}%</strong>
                <span>7h left</span>
              </div>
            </div>
            <div className="batt-side">
              <div>
                <span>Charging</span>
                <strong>{live.battery > 90 ? "Yes" : "No"}</strong>
              </div>
              <div>
                <span>Tracking mode</span>
                <strong>Balanced</strong>
              </div>
              <div>
                <span>GPS accuracy</span>
                <strong>High</strong>
              </div>
              <div>
                <span>Network</span>
                <strong>4G · Strong</strong>
              </div>
            </div>
          </div>
          <Button variant="ghost" full onClick={() => pushToast("Reminder sent to Sarala to charge", "info")}>
            Send charge reminder
          </Button>
        </Card>

        <Card title="Shared With" subtitle="Who can see this location" icon={<Share2 size={19} />}>
          <div className="share-list">
            {[
              { n: "Aryaa Menon", r: "Daughter", a: "Live + history" },
              { n: "Rohit Menon", r: "Son", a: "Live only" },
              { n: "Suresh Kumar", r: "Neighbour", a: "SOS zones only" },
            ].map((p) => (
              <div className="share-row" key={p.n}>
                <span className="sh-avatar">{p.n.split(" ").map((x) => x[0]).join("")}</span>
                <div>
                  <strong>{p.n}</strong>
                  <em>{p.r}</em>
                </div>
                <Badge tone="info">{p.a}</Badge>
              </div>
            ))}
          </div>
          <p className="ps-note">
            Location data is encrypted and stored on your CareGuard account. Viewing is logged.
          </p>
        </Card>
      </div>

      <Modal
        open={zoneOpen}
        onClose={() => setZoneOpen(false)}
        title="Add a safe zone"
        subtitle="You'll be alerted when Sarala leaves this area"
        footer={
          <>
            <Button variant="ghost" onClick={() => setZoneOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setZoneOpen(false);
                pushToast("New safe zone created", "good");
              }}
            >
              Create zone
            </Button>
          </>
        }
      >
        <div className="zone-form">
          <label>
            Zone name
            <input defaultValue="Doctor's clinic" />
          </label>
          <label>
            Radius
            <div className="radius-opts">
              {[50, 100, 150, 250].map((r) => (
                <button key={r} className="on">
                  {r} m
                </button>
              ))}
            </div>
          </label>
          <label className="switch-row">
            <input type="checkbox" defaultChecked />
            Notify me when Sarala enters this zone
          </label>
          <label className="switch-row">
            <input type="checkbox" defaultChecked />
            Attach a photo reminder
          </label>
        </div>
      </Modal>
    </div>
  );
}
