import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CareContext } from "./careContext";
import {
  defaultSettings,
  initialAlerts,
  medications as seedMedications,
  senior,
  vitals,
  wellness as seedWellness,
} from "../data/careData";

let toastId = 0;

export function CareProvider({ children, initialPage = "overview" }) {
  const [activePage, setActivePage] = useState(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [medications, setMedications] = useState(seedMedications);
  const [wellness, setWellness] = useState(seedWellness);
  const [settings, setSettings] = useState(defaultSettings);
  const [toasts, setToasts] = useState([]);
  const [sosState, setSosState] = useState({ active: false, countdown: 0 });
  const [live, setLive] = useState({
    hr: vitals.hr[18],
    spo2: vitals.spo2[18],
    temp: vitals.temp[18],
    battery: senior.device.battery,
  });
  const [nightMode, setNightMode] = useState(false);
  const timers = useRef([]);

  const pushToast = useCallback((message, tone = "info", ttl = 3800) => {
    toastId += 1;
    const id = toastId;
    setToasts((prev) => [...prev, { id, message, tone }]);
    timers.current.push(
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, ttl)
    );
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLive((prev) => ({
        ...prev,
        hr: Math.max(60, Math.min(96, prev.hr + Math.round((Math.random() - 0.5) * 5))),
        spo2: Number(Math.max(94, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 0.6)).toFixed(1)),
        temp: Number((prev.temp + (Math.random() - 0.5) * 0.12).toFixed(1)),
      }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--text-scale", String(settings.textScale));
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduce-motion", settings.reduceMotion);
    root.dataset.night = nightMode ? "on" : "off";
  }, [settings.textScale, settings.highContrast, settings.reduceMotion, nightMode]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const navigate = useCallback((page) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: settings.reduceMotion ? "auto" : "smooth" });
  }, [settings.reduceMotion]);

  const startSos = useCallback(() => {
    setSosState({ active: true, countdown: settings.sosHoldSeconds });
  }, [settings.sosHoldSeconds]);

  const cancelSos = useCallback(() => {
    setSosState({ active: false, countdown: 0 });
    pushToast("Emergency alert cancelled", "info");
  }, [pushToast]);

  const triggerSos = useCallback(() => {
    setSosState({ active: false, countdown: 0 });
    const id = Date.now();
    setAlerts((prev) => [
      {
        id,
        type: "danger",
        icon: "siren",
        title: "SOS triggered",
        detail: "Emergency alert sent to 3 contacts with live location.",
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        date: "Today",
        read: false,
        source: "CareBand X2",
      },
      ...prev,
    ]);
    pushToast("SOS sent to all emergency contacts", "danger", 6000);
  }, [pushToast]);

  useEffect(() => {
    if (!sosState.active) return undefined;
    if (sosState.countdown <= 0) {
      const t = setTimeout(triggerSos, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setSosState((prev) => ({ ...prev, countdown: prev.countdown - 1 }));
    }, 1000);
    return () => clearTimeout(t);
  }, [sosState.active, sosState.countdown, triggerSos]);

  const markMedication = useCallback((id) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              taken: !m.taken,
              takenAt: m.taken
                ? null
                : new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            }
          : m
      )
    );
  }, []);

  const markAlertRead = useCallback((id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }, []);

  const markAllRead = useCallback(
    () => setAlerts((prev) => prev.map((a) => ({ ...a, read: true }))),
    []
  );

  const clearAlert = useCallback((id) => setAlerts((prev) => prev.filter((a) => a.id !== id)), []);

  const toggleWellness = useCallback((id) =>
    setWellness((prev) => prev.map((w) => (w.id === id ? { ...w, done: !w.done } : w))), []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const medsTaken = medications.filter((m) => m.taken).length;
  const nextMed = medications.find((m) => !m.taken) || null;
  const adherencePct = Math.round((medsTaken / medications.length) * 100);
  const wellnessPct = Math.round(
    (wellness.filter((w) => w.done).length / wellness.length) * 100
  );

  const value = useMemo(
    () => ({
      activePage,
      navigate,
      sidebarOpen,
      setSidebarOpen,
      senior,
      vitals,
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
      settings,
      updateSetting,
      nightMode,
      setNightMode,
      toasts,
      pushToast,
      dismissToast,
      sosState,
      startSos,
      cancelSos,
      triggerSos,
      markMedication,
      markAlertRead,
      markAllRead,
      clearAlert,
    }),
    [
      activePage,
      sidebarOpen,
      live,
      alerts,
      unreadCount,
      medications,
      medsTaken,
      adherencePct,
      nextMed,
      wellness,
      wellnessPct,
      settings,
      nightMode,
      toasts,
      sosState,
      navigate,
      startSos,
      cancelSos,
      triggerSos,
      toggleWellness,
      updateSetting,
      markMedication,
      markAlertRead,
      markAllRead,
      clearAlert,
      dismissToast,
      pushToast,
    ]
  );

  return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
}
