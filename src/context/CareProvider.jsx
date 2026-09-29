import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CareContext } from "./careContext";
import { useAuth } from "./authContext";
import { defaultSettings } from "../data/careData";
import {
  fetchCareCircle,
  fetchCareBundle,
  fetchSettings,
  saveSettings,
  saveMedication,
  markAlertRead,
  markAllAlertsRead,
  clearAlert,
  createAlert,
} from "../services/dataService";

let toastId = 0;

/** Shape shown while the first bundle is in flight. */
const EMPTY_BUNDLE = {
  profile: null,
  careStatus: { label: "Loading", tone: "neutral" },
  snapshot: null,
  vitals: null,
  healthVitals: [],
  stats: [],
  heartTrend: { labels: [], series: [] },
  bpTrend: { labels: [], series: [] },
  weekSteps: [],
  weekSleep: [],
  weekMood: [],
  adherence: { taken: 0, total: 0, label: "" },
  weeklyReport: { score: 0, summary: "", highlights: [] },
  medications: [],
  initialAlerts: [],
  activityTimeline: [],
  safeZones: [],
  locationHistory: [],
  emergencyContacts: [],
  careTeam: [],
  medicalProfile: [],
};

/**
 * The application's data store.
 *
 * Everything here is fetched from the API and lives in MongoDB. The context
 * keys the pages already read (`senior`, `vitals`, `alerts`, `medications`,
 * `settings`, `live`) are kept, so the pages needed almost no changes — what
 * changed is where the values come from.
 */
export function CareProvider({ children, initialPage = "overview" }) {
  const { user } = useAuth();

  const [activePage, setActivePage] = useState(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [careCircle, setCareCircle] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [bundle, setBundle] = useState(EMPTY_BUNDLE);
  const [settings, setSettings] = useState(defaultSettings);
  const [toasts, setToasts] = useState([]);
  const [sosState, setSosState] = useState({ active: false, countdown: 0 });
  const [nightMode, setNightMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [live, setLive] = useState({ hr: 0, spo2: 0, temp: 0, battery: null });

  const timers = useRef([]);

  /* ------------------------------------------------------------- feedback */

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

  /**
   * Run a mutating API call: update the screen immediately, then reconcile
   * with whatever the server returns.
   *
   * If the call fails the screen is left as-is and the failure is surfaced as
   * a toast — silently reverting a tap the user just made is worse than
   * showing them it did not save.
   */
  const commit = useCallback(
    async (optimistic, request, failureMessage) => {
      if (optimistic) optimistic();
      try {
        return await request();
      } catch (err) {
        pushToast(err?.message || failureMessage, "danger", 5000);
        return null;
      }
    },
    [pushToast]
  );

  /* ------------------------------------------------------- initial loading */

  // Settings are per-account and independent of the care circle, so they load
  // on their own and a failure there must not block the dashboard.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetchSettings(user.id)
      .then((saved) => {
        if (cancelled) return;
        // Merge rather than replace: a setting added to defaultSettings after
        // this account was created still has a value.
        if (saved) setSettings((prev) => ({ ...prev, ...saved }));
      })
      .catch(() => {
        /* fall back to the defaults already in state */
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // The care circle decides which profile the dashboard is about.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const circle = await fetchCareCircle(user);
        if (cancelled) return;

        setCareCircle(circle);

        const nextId =
          activeProfileId && circle.some((c) => c.elderlyUserId === activeProfileId)
            ? activeProfileId
            : circle[0]?.elderlyUserId ?? null;

        setActiveProfileId(nextId);
        if (!nextId) setBundle(EMPTY_BUNDLE);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Could not load your care circle");
          setCareCircle([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the user only: re-running on activeProfileId
    // would refetch the circle every time the selection changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // The bundle for whichever profile is selected.
  useEffect(() => {
    if (!activeProfileId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchCareBundle(activeProfileId);
        if (cancelled) return;

        setBundle({ ...EMPTY_BUNDLE, ...data });
        setLive({
          hr: data.snapshot?.heartRate ?? 0,
          spo2: data.snapshot?.bloodOxygen ?? 0,
          temp: data.snapshot?.bodyTemperature ?? 0,
          battery: data.profile?.device?.battery ?? null,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Could not load care data");
          setBundle(EMPTY_BUNDLE);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeProfileId]);

  // Refetch the whole bundle on demand.
  const refresh = useCallback(async () => {
    if (!activeProfileId) return;
    try {
      const data = await fetchCareBundle(activeProfileId);
      setBundle({ ...EMPTY_BUNDLE, ...data });
    } catch (err) {
      pushToast(err?.message || "Refresh failed", "danger");
    }
  }, [activeProfileId, pushToast]);

  /* ------------------------------------------------------------ side effects */

  // The live vitals ticker. This jitters the latest reading so the dashboard
  // shows movement; the underlying series is the simulated device stream.
  useEffect(() => {
    if (!bundle.vitals) return undefined;
    const t = setInterval(() => {
      setLive((prev) => ({
        ...prev,
        hr: Math.max(60, Math.min(96, prev.hr + Math.round((Math.random() - 0.5) * 5))),
        spo2: Number(Math.max(94, Math.min(100, prev.spo2 + (Math.random() - 0.5) * 0.6)).toFixed(1)),
        temp: Number((prev.temp + (Math.random() - 0.5) * 0.12).toFixed(1)),
      }));
    }, 4000);
    return () => clearInterval(t);
  }, [bundle.vitals]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--text-scale", String(settings.textScale));
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduce-motion", settings.reduceMotion);
    root.dataset.night = nightMode ? "on" : "off";
  }, [settings.textScale, settings.highContrast, settings.reduceMotion, nightMode]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ---------------------------------------------------------------- actions */

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

    const contacts = bundle.emergencyContacts?.length ?? 0;
    const alert = {
      type: "danger",
      icon: "siren",
      title: "SOS triggered",
      detail: `Emergency alert sent to ${contacts} contacts with live location.`,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      date: "Today",
      source: bundle.profile?.device?.name || "CareGuard",
    };

    if (!activeProfileId) {
      pushToast("SOS recorded, but no profile is selected", "danger", 6000);
      return;
    }

    createAlert(activeProfileId, alert)
      .then((created) => {
        setBundle((prev) => ({ ...prev, initialAlerts: [created, ...prev.initialAlerts] }));
        pushToast(`SOS sent to ${contacts} emergency contacts`, "danger", 6000);
      })
      .catch((err) => {
        pushToast(err?.message || "SOS could not be sent", "danger", 6000);
      });
  }, [activeProfileId, bundle.emergencyContacts, bundle.profile, pushToast]);

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

  /** Tick a dose off. The server owns the schedule, so its list wins. */
  const markMedication = useCallback(
    (id) => {
      const current = bundle.medications.find((m) => m.id === id);
      if (!current) return;

      const taken = !current.taken;
      const next = {
        ...current,
        taken,
        takenAt: taken
          ? new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          : null,
      };

      commit(
        () => setBundle((prev) => ({
          ...prev,
          medications: prev.medications.map((m) => (m.id === id ? next : m)),
        })),
        () => saveMedication(activeProfileId, next),
        "Could not save the medication update"
      ).then((list) => {
        if (list) setBundle((prev) => ({ ...prev, medications: list }));
      });
    },
    [bundle.medications, activeProfileId, commit]
  );

  const readAlert = useCallback(
    (id) => {
      if (!activeProfileId) return;
      commit(
        () => setBundle((prev) => ({
          ...prev,
          initialAlerts: prev.initialAlerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        })),
        () => markAlertRead(activeProfileId, id, true),
        "Could not update the alert"
      );
    },
    [activeProfileId, commit]
  );

  const markAllRead = useCallback(() => {
    if (!activeProfileId) return;
    commit(
      () => setBundle((prev) => ({
        ...prev,
        initialAlerts: prev.initialAlerts.map((a) => ({ ...a, read: true })),
      })),
      () => markAllAlertsRead(activeProfileId),
      "Could not mark alerts read"
    ).then((list) => {
      if (list) setBundle((prev) => ({ ...prev, initialAlerts: list }));
    });
  }, [activeProfileId, commit]);

  const dropAlert = useCallback(
    (id) => {
      if (!activeProfileId) return;
      commit(
        () => setBundle((prev) => ({
          ...prev,
          initialAlerts: prev.initialAlerts.filter((a) => a.id !== id),
        })),
        () => clearAlert(activeProfileId, id),
        "Could not delete the alert"
      ).then((list) => {
        if (list) setBundle((prev) => ({ ...prev, initialAlerts: list }));
      });
    },
    [activeProfileId, commit]
  );

  const toggleWellness = useCallback(
    (id) => {
      if (!user) return;
      const nextWellness = (settings.wellness || []).map((w) =>
        w.id === id ? { ...w, done: !w.done } : w
      );
      setSettings((prev) => ({ ...prev, wellness: nextWellness }));
      saveSettings(user.id, { wellness: nextWellness }).catch(() => {
        pushToast("Could not save the checklist", "danger");
      });
    },
    [user, settings.wellness, pushToast]
  );

  const updateSetting = useCallback(
    (key, value) => {
      if (!user) return;
      setSettings((prev) => ({ ...prev, [key]: value }));
      saveSettings(user.id, { [key]: value }).catch(() => {
        pushToast("Could not save that setting", "danger");
      });
    },
    [user, pushToast]
  );

  /* --------------------------------------------------------------- derived */

  const alerts = bundle.initialAlerts;
  const medications = bundle.medications;
  // Memoised so an account whose settings carry no checklist does not hand the
  // memo a brand new array on every render.
  const wellness = useMemo(() => settings.wellness || [], [settings.wellness]);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const medsTaken = medications.filter((m) => m.taken).length;
  const nextMed = medications.find((m) => !m.taken) || null;
  const adherencePct = medications.length
    ? Math.round((medsTaken / medications.length) * 100)
    : 0;
  const wellnessPct = wellness.length
    ? Math.round((wellness.filter((w) => w.done).length / wellness.length) * 100)
    : 0;

  const value = useMemo(
    () => ({
      /* the keys the existing pages already read ------------------------- */
      activePage,
      navigate,
      sidebarOpen,
      setSidebarOpen,
      senior: bundle.profile,
      vitals: bundle.vitals,
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
      markAlertRead: readAlert,
      markAllRead,
      clearAlert: dropAlert,

      /* everything else the bundle carries ------------------------------- */
      careCircle,
      activeProfileId,
      setActiveProfileId,
      careStatus: bundle.careStatus,
      relationship: bundle.relationship,
      snapshot: bundle.snapshot,
      healthVitals: bundle.healthVitals,
      stats: bundle.stats,
      heartTrend: bundle.heartTrend,
      bpTrend: bundle.bpTrend,
      weekSteps: bundle.weekSteps,
      weekSleep: bundle.weekSleep,
      weekMood: bundle.weekMood,
      adherence: bundle.adherence,
      weeklyReport: bundle.weeklyReport,
      activityTimeline: bundle.activityTimeline,
      safeZones: bundle.safeZones,
      locationHistory: bundle.locationHistory,
      emergencyContacts: bundle.emergencyContacts,
      careTeam: bundle.careTeam,
      medicalProfile: bundle.medicalProfile,
      simulated: bundle.simulated !== false,

      /* lifecycle -------------------------------------------------------- */
      loading,
      error,
      refresh,
    }),
    [
      activePage, navigate, sidebarOpen, live, alerts, unreadCount, medications,
      medsTaken, adherencePct, nextMed, wellness, wellnessPct, settings,
      nightMode, toasts, sosState, careCircle, activeProfileId, bundle,
      loading, error, startSos, cancelSos, triggerSos, toggleWellness,
      updateSetting, markMedication, readAlert, markAllRead, dropAlert,
      pushToast, dismissToast, refresh,
    ]
  );

  return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
}
