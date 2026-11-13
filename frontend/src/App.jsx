import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "./api";

// Layout & Navigation Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";

// Public & Auth Pages
import LandingPage from "./pages/LandingPage";
import AuthModal from "./auth/AuthModal";

// Authenticated Pages
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Analytics from "./pages/Analytics";
import PeerBenchmarking from "./pages/PeerBenchmarking";
import Goals from "./pages/Goals";
import Recommendations from "./pages/Recommendations";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./components/Achievements";
import Organisation from "./pages/Organisation";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AiChatbot from "./components/AiChatbot";

const CATEGORY_NAMES = {
  1: "Transport",
  2: "Electricity",
  3: "Food",
  4: "Shopping",
  5: "Waste",
};

const ACTIVITY_NAMES = {
  1: "Car Travel",
  2: "Bus Commute",
  3: "Train Ride",
  4: "Flight Travel",
  5: "Motorcycle",
  6: "Bicycle",
  7: "Walking",
  8: "Home Electricity",
  9: "Office Electricity",
  10: "Renewable Electricity",
  11: "Beef",
  12: "Chicken",
  13: "Pork",
  14: "Fish",
  15: "Dairy",
  16: "Vegetarian Meal",
  17: "Vegan Meal",
  18: "Clothing",
  19: "Electronics",
  20: "Furniture",
  21: "Household Goods",
  22: "Landfill Waste",
};

function normalizeActivity(item) {
  return {
    ...item,
    id: item.id || item.activityLogId,
    date: item.logDate ?? item.date ?? "",
    co2e: Number(item.co2eKg ?? item.co2e ?? 0),
    category:
      item.category?.name ??
      item.category ??
      CATEGORY_NAMES[item.categoryId] ??
      "Other",
    activity:
      item.activity ??
      item.activityName ??
      item.activityType?.name ??
      ACTIVITY_NAMES[item.activityTypeId] ??
      "Activity",
  };
}

export default function App() {
  // Navigation states
  const [activePage, setActivePage] = useState("Dashboard");
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("carbontrack_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("carbontrack_sidebar_collapsed", String(next));
      } catch {
        // Safe fallback
      }
      return next;
    });
  }, []);

  // Authentication session states
  const [token, setToken] = useState(
    () => sessionStorage.getItem("carbontrack_token") || localStorage.getItem("carbontrack_token") || ""
  );

  const [email, setEmail] = useState(
    () => sessionStorage.getItem("carbontrack_email") || localStorage.getItem("carbontrack_email") || ""
  );

  const [userName, setUserName] = useState(
    () => sessionStorage.getItem("carbontrack_userName") || localStorage.getItem("carbontrack_userName") || "User"
  );

  const [avatarUrl, setAvatarUrl] = useState(
    () => sessionStorage.getItem("carbontrack_avatarUrl") || localStorage.getItem("carbontrack_avatarUrl") || ""
  );

  const [userRole, setUserRole] = useState(
    () => sessionStorage.getItem("carbontrack_role") || localStorage.getItem("carbontrack_role") || "USER"
  );

  const [authError, setAuthError] = useState("");
  const [activities, setActivities] = useState([]);
  const [, setActivitiesLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [monthlyTarget, setMonthlyTarget] = useState(200);

  // AI Chatbot States
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatContext, setAiChatContext] = useState(null);

  function handleOpenAiChat(context = null) {
    setAiChatContext(context);
    setAiChatOpen(true);
  }

  // Purge any legacy project keys (e.g. PlacePrep) from storage
  useEffect(() => {
    try {
      const legacyKeys = [
        "placeprep_token",
        "placeprep_email",
        "placeprep_user",
        "placeprep_userName",
        "placeprep_avatarUrl",
        "placeprep_role",
        "prep_token",
        "prep_user",
      ];
      legacyKeys.forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {
      // Storage access restricted in some environments
    }
  }, []);

  function clearSession(message = "") {
    sessionStorage.removeItem("carbontrack_token");
    sessionStorage.removeItem("carbontrack_email");
    sessionStorage.removeItem("carbontrack_userName");
    sessionStorage.removeItem("carbontrack_avatarUrl");
    sessionStorage.removeItem("carbontrack_role");

    localStorage.removeItem("carbontrack_token");
    localStorage.removeItem("carbontrack_email");
    localStorage.removeItem("carbontrack_userName");
    localStorage.removeItem("carbontrack_avatarUrl");
    localStorage.removeItem("carbontrack_role");

    try {
      ["placeprep_token", "placeprep_email", "placeprep_user"].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {
      // Ignored
    }

    setToken("");
    setEmail("");
    setUserName("User");
    setAvatarUrl("");
    setUserRole("USER");
    setActivities([]);
    setSummaryData(null);
    setAuthModal({ open: false, mode: "login" });
    setAuthError(message);
    setActivePage("Dashboard");
  }

  // Load user data & saved activities
  const loadUserData = useCallback(async () => {
    if (!token) return;

    setActivitiesLoading(true);
    setAuthError("");

    try {
      const [acts, summary, profile] = await Promise.allSettled([
        apiRequest("/api/activities", { method: "GET", token }),
        apiRequest("/api/analytics/summary", { method: "GET", token }),
        apiRequest("/api/users/profile", { method: "GET", token }),
      ]);

      if (acts.status === "fulfilled" && Array.isArray(acts.value)) {
        setActivities(acts.value.map(normalizeActivity));
      }

      if (summary.status === "fulfilled" && summary.value) {
        setSummaryData(summary.value);
        if (summary.value.monthlyTargetKg) {
          setMonthlyTarget(Number(summary.value.monthlyTargetKg));
        }
      }

      if (profile.status === "fulfilled" && profile.value) {
        if (profile.value.displayName) {
          setUserName(profile.value.displayName);
          sessionStorage.setItem("carbontrack_userName", profile.value.displayName);
        }
        if (profile.value.avatarUrl) {
          setAvatarUrl(profile.value.avatarUrl);
          sessionStorage.setItem("carbontrack_avatarUrl", profile.value.avatarUrl);
        }
        if (profile.value.role) {
          setUserRole(profile.value.role);
          sessionStorage.setItem("carbontrack_role", profile.value.role);
        }
      }
    } catch (error) {
      if (error.message?.includes("expired") || error.message?.includes("401")) {
        clearSession("Your session has expired. Please sign in again.");
      } else {
        setAuthError(error.message || "Unable to load dashboard data.");
      }
    } finally {
      setActivitiesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => {
      loadUserData();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadUserData]);

  // Handle successful login
  function handleLogin(receivedToken, loginEmail, loginName, loginAvatar = "") {
    sessionStorage.setItem("carbontrack_token", receivedToken);
    sessionStorage.setItem("carbontrack_email", loginEmail);
    sessionStorage.setItem("carbontrack_userName", loginName || "User");
    sessionStorage.setItem("carbontrack_avatarUrl", loginAvatar || "");

    setToken(receivedToken);
    setEmail(loginEmail);
    setUserName(loginName || "User");
    setAvatarUrl(loginAvatar || "");
    setAuthError("");
    setAuthModal({ open: false, mode: "login" });
    setActivePage("Dashboard");
  }

  // Handle registration
  async function handleRegister({ name, email: registerEmail, password }) {
    setAuthError("");

    try {
      const res = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { name, email: registerEmail, password },
      });

      if (res?.token) {
        handleLogin(res.token, registerEmail, name, "");
      } else {
        setAuthModal({ open: true, mode: "login" });
        setAuthError("Account created successfully! Please sign in.");
      }
    } catch (error) {
      setAuthError(error.message || "Unable to create account.");
      throw error;
    }
  }

  // Handle logout
  function handleLogout() {
    clearSession();
  }

  // Save new activity
  async function handleAddActivity(activity) {
    setAuthError("");

    try {
      const saved = await apiRequest("/api/activities", {
        method: "POST",
        token,
        body: activity,
      });

      const normalized = normalizeActivity(saved);
      setActivities((prev) => [normalized, ...prev]);

      // Refresh analytics summary
      apiRequest("/api/analytics/summary", { token })
        .then((s) => setSummaryData(s))
        .catch(() => {});

      return normalized;
    } catch (error) {
      if (error.message?.includes("expired") || error.message?.includes("401")) {
        clearSession("Your session has expired. Please sign in again.");
      } else {
        setAuthError(error.message || "Unable to save activity.");
      }
      throw error;
    }
  }

  // Edit existing activity
  async function handleUpdateActivity(id, updatedFields) {
    try {
      const updated = await apiRequest(`/api/activities/${id}`, {
        method: "PUT",
        token,
        body: updatedFields,
      });

      const normalized = normalizeActivity(updated);
      setActivities((prev) => prev.map((a) => (a.id === id ? normalized : a)));

      apiRequest("/api/analytics/summary", { token })
        .then((s) => setSummaryData(s))
        .catch(() => {});

      return normalized;
    } catch (error) {
      setAuthError(error.message || "Failed to update activity.");
      throw error;
    }
  }

  // Delete activity
  async function handleDeleteActivity(id) {
    try {
      await apiRequest(`/api/activities/${id}`, {
        method: "DELETE",
        token,
      });

      setActivities((prev) => prev.filter((a) => a.id !== id));

      apiRequest("/api/analytics/summary", { token })
        .then((s) => setSummaryData(s))
        .catch(() => {});
    } catch (error) {
      setAuthError(error.message || "Failed to delete activity.");
      throw error;
    }
  }

  // ==========================================
  // UNAUTHENTICATED PUBLIC LANDING & AUTH MODAL
  // ==========================================
  if (!token) {
    return (
      <>
        <LandingPage
          onGetStarted={() => setAuthModal({ open: true, mode: "login" })}
          onSignIn={() => setAuthModal({ open: true, mode: "login" })}
        />

        <AuthModal
          isOpen={authModal.open}
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: "login" })}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </>
    );
  }

  // ==========================================
  // AUTHENTICATED APPLICATION WORKSPACE
  // ==========================================
  return (
    <div className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        userName={userName}
        userEmail={email}
        avatarUrl={avatarUrl}
        userRole={userRole}
        onLogout={handleLogout}
        onOpenAiChat={() => handleOpenAiChat("")}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      <div className="app-main-wrapper">
        {/* Dashboard Header */}
        <Header
          activePage={activePage}
          token={token}
          userName={userName}
          userEmail={email}
          avatarUrl={avatarUrl}
          userRole={userRole}
          onNavigate={setActivePage}
          onLogout={handleLogout}
          onOpenAiChat={() => handleOpenAiChat("")}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="main-content">
          <ErrorBoundary>
            {authError && (
              <div className="global-error-banner" role="alert">
                <span>{authError}</span>
                <button type="button" onClick={() => setAuthError("")}>✕</button>
              </div>
            )}

            {activePage === "Dashboard" && (
              <Dashboard
                activities={activities}
                monthlyTarget={monthlyTarget}
                summaryData={summaryData}
                onNavigate={setActivePage}
                token={token}
                userName={userName}
              />
            )}

            {activePage === "Log Activities" && (
              <Activities
                activities={activities}
                onAddActivity={handleAddActivity}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
                token={token}
                userRole={userRole}
              />
            )}

            {activePage === "Analytics" && (
              <Analytics token={token} />
            )}

            {activePage === "Peer Benchmarking" && (
              <PeerBenchmarking token={token} onNavigate={setActivePage} />
            )}

            {activePage === "Goals" && (
              <Goals
                token={token}
                activities={activities}
                monthlyTarget={monthlyTarget}
                onUpdateTarget={setMonthlyTarget}
              />
            )}

            {activePage === "Recommendations" && (
              <Recommendations
                token={token}
                onNavigate={setActivePage}
                onOpenAiChat={handleOpenAiChat}
              />
            )}

            {activePage === "Leaderboard" && (
              <Leaderboard token={token} onNavigate={setActivePage} userName={userName} />
            )}

            {activePage === "Achievements" && (
              <Achievements
                activities={activities}
                token={token}
                onNavigate={setActivePage}
                userName={userName}
              />
            )}

            {activePage === "Organisation" && (
              <Organisation token={token} />
            )}

            {activePage === "Profile" && (
              <Profile
                token={token}
                userEmail={email}
                onProfileUpdated={({ displayName, avatarUrl: newAvatar }) => {
                  if (displayName) setUserName(displayName);
                  if (newAvatar) setAvatarUrl(newAvatar);
                }}
              />
            )}

            {activePage === "Settings" && (
              <Settings token={token} userEmail={email} activities={activities} />
            )}
          </ErrorBoundary>
        </main>

        {/* AI Sustainability Chatbot (Floating) */}
        <AiChatbot
          token={token}
          isOpen={aiChatOpen}
          onToggle={() => setAiChatOpen((prev) => !prev)}
          initialContext={aiChatContext}
          onClearContext={() => setAiChatContext(null)}
        />
      </div>
    </div>
  );
}
