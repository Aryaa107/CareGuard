import { useState } from "react";

import Sidebar from "./components/Sidebar";
import SosDialog from "./components/SosDialog";
import Topbar from "./components/Topbar";
import { ToastStack } from "./components/UI";

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

function Shell({ onLogout }) {
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

export default function App({ initialPage = "overview" }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [authPage, setAuthPage] = useState("login");

  const [registeredAccounts, setRegisteredAccounts] =
    useState([]);

  const handleLogin = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setAuthPage("login");
  };

  const handleRegistered = (account) => {
    setRegisteredAccounts((prev) => [
      ...prev,
      account,
    ]);

    setAuthPage("login");
  };

  /*
   * NOT LOGGED IN
   */
  if (!isLoggedIn) {
    if (authPage === "register") {
      return (
        <Register
          onRegistered={handleRegistered}
          onBackToLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onCreateAccount={() =>
          setAuthPage("register")
        }
        registeredAccounts={registeredAccounts}
      />
    );
  }

  /*
   * PATIENT
   */
  if (userRole === "patient") {
  return (
    <CareProvider initialPage="senior">
      <SeniorMode
        onLogout={handleLogout}
      />
    </CareProvider>
  );
}

  /*
   * CAREGIVER
   */
  return (
    <CareProvider initialPage={initialPage}>
      <Shell onLogout={handleLogout} />
    </CareProvider>
  );
}
