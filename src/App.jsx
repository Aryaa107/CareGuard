import { useState } from "react";

import Sidebar from "./components/Sidebar";
import SosDialog from "./components/SosDialog";
import Topbar from "./components/Topbar";
import { ToastStack } from "./components/UI";

import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/authContext";
import { CareProvider } from "./context/CareProvider";
import { useCare } from "./context/careContext";

import Overview from "./pages/Overview";
import Health from "./pages/Health";
import Emergency from "./pages/Emergency";
import Location from "./pages/Location";
import Medications from "./pages/Medications";
import Activity from "./pages/Activity";
import Family from "./pages/Family";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import SeniorMode from "./pages/SeniorMode";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import Register from "./pages/Register";

import "./App.css";

const pages = {
  overview: Overview,
  health: Health,
  emergency: Emergency,
  location: Location,
  medications: Medications,
  activity: Activity,
  family: Family,
  alerts: Alerts,
  reports: Reports,
  settings: Settings,
};

function Shell() {
  const {
    activePage,
    toasts,
    dismissToast,
    sosState,
  } = useCare();

  const Page = pages[activePage] || Overview;

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <Topbar />

        <div className="content-area">
          <Page />
        </div>
      </main>

      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
      />

      <SosDialog />

      {sosState.active && (
        <div
          className="sos-overlay"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ states */

function Splash({ message }) {
  return (
    <div className="auth-page">
      <div className="auth-container" role="status" aria-live="polite">
        <div className="auth-brand">
          <div className="auth-logo">❤</div>
          <h1>CareGuard</h1>
        </div>
        <p className="auth-subtitle">{message}</p>
      </div>
    </div>
  );
}

/**
 * A brand new account has nobody in its care circle. Showing the dashboard
 * anyway would mean inventing a patient, so this says so plainly instead.
 */
function EmptyCircle({ onSignOut }) {
  const { navigate, careCircle } = useCare();

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="content-area">
          <div className="card">
            <h2>No one in your care circle yet</h2>
            <p>
              CareGuard only shows health data for people you have been linked
              to. Ask an elderly person or family member to add you, or
              register with the demo dataset to explore a sample household.
            </p>
            {careCircle.length === 0 && (
              <p className="muted">
                You are signed in as a caregiver with no linked profiles.
              </p>
            )}
            <button className="btn" onClick={() => navigate("settings")}>
              Open settings
            </button>
            <button className="btn ghost" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --------------------------------------------------------------------- app */

function Routed() {
  const { isElderly, signOut } = useAuth();
  const { careCircle, loading } = useCare();

  if (loading) return <Splash message="Loading your care circle…" />;

  if (!careCircle.length) {
    return <EmptyCircle onSignOut={signOut} />;
  }

  // An elderly-role account gets the simplified four-button screen.
  if (isElderly) {
    return <SeniorMode onLogout={signOut} />;
  }

  return <Shell />;
}

function AuthGate() {
  const { status, isAuthenticated, isElderly, signIn, signUp } = useAuth();
  const [authPage, setAuthPage] = useState("login");
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return <Splash message="Checking your session…" />;
  }

  if (!isAuthenticated) {
    if (authPage === "register") {
      return (
        <Register
          onSubmit={async (payload) => {
            setSubmitting(true);
            try {
              await signUp(payload);
            } finally {
              setSubmitting(false);
            }
          }}
          onBackToLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    return (
      <Login
        submitting={submitting}
        onSubmit={async (email, password) => {
          setSubmitting(true);
          try {
            await signIn(email, password);
          } finally {
            setSubmitting(false);
          }
        }}
        onCreateAccount={() =>
          setAuthPage("register")
        }
      />
    );
  }

  return (
    <CareProvider initialPage={isElderly ? "senior" : "overview"}>
      <Routed />
    </CareProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
