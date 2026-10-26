
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

import Sidebar from "./components/Sidebar";
import Activities from "./pages/Activities";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Leaderboard from "./pages/Leaderboard";
import Organisation from "./pages/Organisation";
import Achievements from "./components/Achievements";

import Login from "./auth/Login";
import Register from "./auth/Register";

const categoryNames = {
  1: "Transport",
  2: "Electricity",
  3: "Food",
  4: "Shopping",
};

const activityNames = {
  1: "Car",
  2: "Bus",
  3: "Train",
  4: "Flight",
  5: "Motorcycle",
  6: "Bicycle",
  7: "Walking",
  8: "Home electricity",
  9: "Office electricity",
  10: "Renewable electricity",
  11: "Beef",
  12: "Chicken",
  13: "Pork",
  14: "Fish",
  15: "Dairy",
  16: "Vegetarian meal",
  17: "Vegan meal",
  18: "Clothing",
  19: "Electronics",
  20: "Furniture",
  21: "Household goods",
};

function normalizeActivity(item) {
  return {
    ...item,
    date: item.logDate ?? item.date ?? "",
    co2e: Number(item.co2eKg ?? item.co2e ?? 0),
    category:
      item.category?.name ??
      item.category ??
      categoryNames[item.categoryId] ??
      "Other",
    activity:
      item.activity ??
      item.activityName ??
      item.activityType?.name ??
      activityNames[item.activityTypeId] ??
      "Activity",
  };
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [authPage, setAuthPage] = useState("login");

  const [token, setToken] = useState(
    () => sessionStorage.getItem("carbontrack_token") || ""
  );

  const [email, setEmail] = useState(
    () => sessionStorage.getItem("carbontrack_email") || ""
  );

  const [userName, setUserName] = useState(
    () => sessionStorage.getItem("carbontrack_userName") || ""
  );

  const [authError, setAuthError] = useState("");
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [monthlyTarget, setMonthlyTarget] = useState(200);

  function clearSession(message = "") {
    sessionStorage.removeItem("carbontrack_token");
    sessionStorage.removeItem("carbontrack_email");
    sessionStorage.removeItem("carbontrack_userName");

    setToken("");
    setEmail("");
    setUserName("");
    setActivities([]);
    setAuthPage("login");
    setAuthError(message);
    setActivePage("Dashboard");
  }

  useEffect(() => {
    if (!token) {
      setActivities([]);
      return undefined;
    }

    let cancelled = false;

    async function loadActivities() {
      setActivitiesLoading(true);
      setAuthError("");

      try {
        const response = await apiRequest("/api/activities", {
          method: "GET",
          token,
        });

        if (!Array.isArray(response)) {
          throw new Error(
            "The activities endpoint did not return a list."
          );
        }

        if (!cancelled) {
          setActivities(response.map(normalizeActivity));
        }
      } catch (error) {
        if (cancelled) return;

        if (error.message?.includes("401")) {
          clearSession(
            "Your session is invalid or expired. Please sign in again."
          );
        } else {
          setAuthError(
            error.message || "Unable to load saved activities."
          );
        }
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleLogin(receivedToken, loginEmail, loginName) {
    const normalizedEmail = loginEmail.trim().toLowerCase();

    const savedName =
      localStorage.getItem(`carbontrack_name_${normalizedEmail}`) || "";

    const finalName =
      loginName && loginName !== "User"
        ? loginName
        : savedName || "User";

    sessionStorage.setItem("carbontrack_token", receivedToken);
    sessionStorage.setItem("carbontrack_email", loginEmail);
    sessionStorage.setItem("carbontrack_userName", finalName);

    setToken(receivedToken);
    setEmail(loginEmail);
    setUserName(finalName);
    setAuthError("");
  }

  async function handleRegister({
    name,
    email: registerEmail,
    password,
  }) {
    setAuthError("");

    const trimmedName = name.trim();
    const trimmedEmail = registerEmail.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: trimmedName,
          email: trimmedEmail,
          password,
        },
      });

      // Remember the registered name for this browser.
      localStorage.setItem(
        `carbontrack_name_${normalizedEmail}`,
        trimmedName
      );

      setAuthPage("login");
      setAuthError(
        "Account created successfully. Please sign in with your new account."
      );
    } catch (error) {
      setAuthError(
        error.message || "Unable to create account."
      );
    }
  }

  function handleLogout() {
    clearSession();
  }

  async function handleAddActivity(activity) {
    setAuthError("");

    try {
      const saved = await apiRequest("/api/activities", {
        method: "POST",
        token,
        body: activity,
      });

      const normalized = normalizeActivity(saved);

      setActivities((previous) => [...previous, normalized]);
      setActivePage("Dashboard");

      return normalized;
    } catch (error) {
      if (error.message?.includes("401")) {
        clearSession(
          "Your session is invalid or expired. Please sign in again."
        );
      } else {
        setAuthError(
          error.message || "Unable to save activity."
        );
      }

      throw error;
    }
  }

  if (!token) {
    if (authPage === "register") {
      return (
        <>
          {authError && <p role="alert">{authError}</p>}

          <Register
            onRegister={handleRegister}
            onLogin={() => {
              setAuthPage("login");
              setAuthError("");
            }}
          />
        </>
      );
    }

    return (
      <>
        {authError && <p role="status">{authError}</p>}

        <Login
          onLogin={handleLogin}
          onRegister={() => {
            setAuthPage("register");
            setAuthError("");
          }}
        />
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        userName={userName}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {authError && <p role="alert">{authError}</p>}

        {activePage === "Dashboard" ? (
          <>
            {activitiesLoading && (
              <p>Loading your saved activities...</p>
            )}

            <Dashboard
              activities={activities}
              monthlyTarget={monthlyTarget}
            />
          </>
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
        ) : activePage === "Achievements" ? (
          <Achievements
            activities={activities}
            monthlyTarget={monthlyTarget}
          />
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
