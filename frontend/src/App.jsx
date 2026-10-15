
import { useState, useEffect } from "react";
import { Bell, UserRound } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Activities from "./pages/Activities";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Leaderboard from "./pages/Leaderboard";
import Organisation from "./pages/Organisation";
import Login from "./auth/Login";
import Register from "./auth/Register";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem("carbontrack_activities");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [monthlyTarget, setMonthlyTarget] = useState(() => {
    try {
      const saved = localStorage.getItem("carbontrack_monthlyTarget");

      if (saved === null) return 200;

      const target = Number(saved);
      return Number.isFinite(target) && target > 0 ? target : 200;
    } catch {
      return 200;
    }
  });

  const [authPage, setAuthPage] = useState("login");

  useEffect(() => {
    localStorage.setItem(
      "carbontrack_activities",
      JSON.stringify(activities)
    );
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(
      "carbontrack_monthlyTarget",
      String(monthlyTarget)
    );
  }, [monthlyTarget]);

  const handleAddActivity = (activity) => {
    setActivities((previous) => [...previous, activity]);
    setActivePage("Dashboard");
  };

  // Show Login first
  if (authPage === "login") {
    return (
      <Login
        onLogin={() => setAuthPage("app")}
        onRegister={() => setAuthPage("register")}
      />
    );
  }

  // Show Registration
  if (authPage === "register") {
    return (
      <Register
        onRegister={() => setAuthPage("login")}
        onLogin={() => setAuthPage("login")}
      />
    );
  }

  // Main CarbonTrack application
  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Welcome to CarbonTrack 🌱</h1>
            <p>Track your activities. Build a greener future.</p>
          </div>

          <div className="profile">
            <Bell size={20} />
            <UserRound size={20} />
            <span>User</span>
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <Dashboard
            activities={activities}
            monthlyTarget={monthlyTarget}
          />
        ) : activePage === "Log Activities" ? (
          <Activities onAddActivity={handleAddActivity} />
        ) : activePage === "Goals" ? (
          <Goals
            activities={activities}
            monthlyTarget={monthlyTarget}
            onUpdateTarget={setMonthlyTarget}
          />
        ) : activePage === "Leaderboard" ? (
          <Leaderboard />
        ) : activePage === "Organisation" ? (
          <Organisation />
        ) : (
          <section className="panel welcome-panel">
            <h2>{activePage}</h2>
            <p>This page will be implemented next.</p>
          </section>
        )}
      </main>
    </div>
  );
}
