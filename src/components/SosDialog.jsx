import { Check, Siren, X } from "lucide-react";
import { useCare } from "../context/careContext";
import { Badge, Button, Modal } from "./UI";

export default function SosDialog() {
  const { sosState, cancelSos, settings, emergencyContacts } = useCare();

  const total = Math.max(settings.sosHoldSeconds, 1);
  const progress = `${(sosState.countdown / total) * 360}deg`;

  return (
    <Modal
      open={sosState.active}
      onClose={cancelSos}
      title="Sending emergency alert"
      subtitle={`Cancels in ${sosState.countdown} second${sosState.countdown === 1 ? "" : "s"}`}
      footer={
        <>
          <Button variant="ghost" icon={<X size={16} />} onClick={cancelSos}>
            Cancel alert
          </Button>
          <Button variant="danger" icon={<Siren size={16} />} onClick={cancelSos}>
            Keep waiting
          </Button>
        </>
      }
    >
      <div className="sos-modal">
        <div className="sm-timer">
          <span className="sm-ring" style={{ "--p": progress }}>
            <strong>{sosState.countdown}</strong>
          </span>
          <p>Alerting your contacts in sequence</p>
        </div>

        <div className="sm-list">
          {emergencyContacts.map((c, i) => (
            <div className="sm-row" key={c.id}>
              <span className={`sm-step ${i === 0 ? "now" : ""}`}>{i + 1}</span>
              <strong>{c.name}</strong>
              <em>{c.relation}</em>
              <Badge tone={i === 0 ? "danger" : "neutral"}>
                {i === 0 ? "Calling now" : "Queued"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="sm-attach">
          <Check size={15} /> Live location · Medical profile · Last 24h activity attached
        </div>
      </div>
    </Modal>
  );
}
