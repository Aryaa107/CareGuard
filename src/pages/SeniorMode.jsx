import { useState } from "react";
import {
  HeartPulse,
  Home,
  Phone,
  Pill,
  Play,
  Siren,
  Sun,
  Users,
  Volume2,
} from "lucide-react";
import { Badge, Button, ProgressBar } from "../components/UI";
import useClock from "../hooks/useClock";
import { useCare } from "../context/careContext";

export default function SeniorMode({ onLogout }) {
  const {
    live,
    medications,
    medsTaken,
    nextMed,
    markMedication,
    startSos,
    pushToast,
    settings,
    senior,
  } = useCare();
  const now = useClock();
  const [spoke, setSpoke] = useState("");

  const hour = now ? now.getHours() : 12;
  const partOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const say = (text) => {
    setSpoke(text);
    pushToast(text, "good");
    if (settings.voiceAssist && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  return (
    <div className="page senior-page">
      <div className="senior-hero">
        <div className="sh-clock">
          <strong>
            {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}
          </strong>
          <span>
            {now
              ? now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })
              : ""}
          </span>
          <Badge tone="good" dot>
            {nextMed ? `Next medicine at ${nextMed.time}` : "All medicines taken"}
          </Badge>
        </div>

        <div className="sh-greet">
          <Sun size={34} />
          <h2>
            Good {partOfDay}, {senior?.shortName || senior?.name || "there"}
          </h2>
          <p>You are safe at home. Here is your day.</p>
        </div>

        <button className="sh-signout" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="big-actions">
        <button
          className="big-btn ok"
          onClick={() => {
            say("Thank you. Aryaa has been told that you are fine.");
            pushToast("Aryaa notified — Sarala is okay", "good");
          }}
        >
          <span className="bb-ico">
            <HeartPulse size={38} />
          </span>
          <strong>I am okay</strong>
          <em>Tell Aryaa you are fine</em>
        </button>

        <button className="big-btn call" onClick={() => say("Calling Aryaa now.")}>
          <span className="bb-ico">
            <Phone size={38} />
          </span>
          <strong>Call my family</strong>
          <em>Aryaa · Rohit · Neha</em>
        </button>

        <button
          className="big-btn meds"
          onClick={() => {
            const next = medications.find((m) => !m.taken);
            if (next) {
              say(`${next.name}. Please take one tablet now.`);
              markMedication(next.id);
            } else {
              say("You have taken all your medicines for today.");
            }
          }}
        >
          <span className="bb-ico">
            <Pill size={38} />
          </span>
          <strong>My medicines</strong>
          <em>
            {medsTaken} of {medications.length} taken today
          </em>
        </button>

        <button className="big-btn help" onClick={startSos}>
          <span className="bb-ico">
            <Siren size={38} />
          </span>
          <strong>I need help</strong>
          <em>Calls everyone you love</em>
        </button>
      </div>

      <div className="senior-cols">
        <div className="sc-card">
          <h3>
            <Pill size={24} /> Today&apos;s medicines
          </h3>
          {medications.map((m) => (
            <div className={`sc-med ${m.taken ? "taken" : ""}`} key={m.id}>
              <div>
                <strong>{m.name}</strong>
                <em>{m.time}</em>
              </div>
              <button
                className="sc-take"
                onClick={() => {
                  markMedication(m.id);
                  say(m.taken ? "Changed back to not taken." : `${m.name} marked as taken.`);
                }}
              >
                {m.taken ? "Taken" : "Take now"}
              </button>
            </div>
          ))}
        </div>

        <div className="sc-card">
          <h3>
            <HeartPulse size={24} /> How you are doing
          </h3>
          {[
            { l: "Heart", v: `${live.hr}`, u: "beats per minute", t: "good" },
            { l: "Breathing", v: `${live.spo2}%`, u: "blood oxygen", t: "good" },
            { l: "Body heat", v: `${live.temp}°`, u: "normal", t: "good" },
            { l: "Walking", v: "6,842", u: "steps today", t: "info" },
          ].map((r) => (
            <div className={`sc-vital tone-${r.t}`} key={r.l}>
              <div>
                <strong>{r.v}</strong>
                <em>{r.u}</em>
              </div>
              <span>{r.l}</span>
            </div>
          ))}
          <ProgressBar value={medsTaken} max={medications.length} tone="primary" label="Medicines completed" right={`${medsTaken}/${medications.length}`} />
        </div>

        <div className="sc-card">
          <h3>
            <Home size={24} /> Who is looking after you
          </h3>
          {[
            { n: "Aryaa", r: "Your daughter", a: "AM" },
            { n: "Rohit", r: "Your son", a: "RM" },
            { n: "Neha", r: "Your granddaughter", a: "NM" },
          ].map((p) => (
            <button className="sc-person" key={p.n} onClick={() => say(`Calling ${p.n}.`)}>
              <span className="sp-avatar">{p.a}</span>
              <div>
                <strong>{p.n}</strong>
                <em>{p.r}</em>
              </div>
              <Phone size={20} />
            </button>
          ))}
          <Button variant="ghost" full icon={<Users size={18} />} onClick={() => say("Your care circle is available any time.")}>
            See everyone
          </Button>
        </div>
      </div>

      <div className="senior-actions">
        <Button variant="primary" size="lg" icon={<Volume2 size={20} />} onClick={() => say("It is now afternoon. You have one medicine left, at eight o'clock. You are safe at home.")}>
          Read my day out loud
        </Button>
        <Button variant="ghost" size="lg" icon={<Play size={20} />} onClick={() => say("Playing your favourite music.")}>
          Play music
        </Button>
        {spoke && <span className="said">{spoke}</span>}
      </div>
    </div>
  );
}
