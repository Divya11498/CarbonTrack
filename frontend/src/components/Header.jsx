import { useState, useEffect, useRef } from "react";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Bot,
  User,
  Settings,
  LogOut,
  Sparkles,
  Award,
  Target,
  BarChart3,
  Shield,
  Check,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { apiRequest } from "../api";
import UserAvatar from "./UserAvatar";

const PAGE_SUBTITLES = {
  Dashboard: "Here's your sustainability overview for today.",
  "Log Activities": "Log your daily transport, energy, food, and waste footprint.",
  Analytics: "Analyze historical trends, weekly progress, and category distribution.",
  "Peer Benchmarking": "Compare your carbon footprint and reduction pace against platform cohort averages.",
  Goals: "Track your active carbon reduction targets and daily budgets.",
  Recommendations: "Personalized, high-impact actions suggested by CarbonTrack AI.",
  Achievements: "Celebrate your sustainability milestones and earned badges.",
  Leaderboard: "See where your eco-progress ranks across the community.",
  Organisation: "Enterprise carbon reporting and departmental breakdowns.",
  Profile: "Manage your personal lifestyle baseline and credentials.",
  Settings: "Configure measurement units, email digests, and privacy options.",
};

export default function Header({
  activePage = "Dashboard",
  userName = "",
  userEmail = "",
  avatarUrl = "",
  avatarSeed = "",
  userRole = "Member",
  token = "",
  onNavigate,
  onLogout,
  onToggleMobileSidebar,
  onOpenAiChat,
}) {
  const { isDark, toggleTheme } = useTheme();

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);

  const profileRef = useRef(null);
  const notifsRef = useRef(null);

  // Compute local time-based personalized greeting derived during render
  const hour = new Date().getHours();
  let timeGreeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
  } else if (hour >= 17 || hour < 5) {
    timeGreeting = "Good evening";
  }
  const cleanName =
    userName && userName.trim() && userName !== "User" && userName !== "Eco Champion"
      ? userName.trim().split(" ")[0]
      : "";
  const greetingText = cleanName ? `${timeGreeting}, ${cleanName}!` : `${timeGreeting}!`;

  // Fetch real notifications from backend on mount or page change
  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    apiRequest("/api/notifications", { token })
      .then((res) => {
        if (isMounted && Array.isArray(res?.notifications)) {
          setNotifications(res.notifications);
        }
      })
      .catch(() => {
        // Non-blocking
      });

    return () => {
      isMounted = false;
    };
  }, [token, activePage]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(event.target)) {
        setNotifsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, {
        method: "POST",
        token,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Fall back to optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiRequest("/api/notifications/read-all", {
        method: "POST",
        token,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const subtitle =
    PAGE_SUBTITLES[activePage] || "Track your carbon footprint and build sustainable habits.";

  const getNotifIcon = (type = "") => {
    const t = String(type).toUpperCase();
    if (t.includes("ACHIEVEMENT") || t.includes("BADGE")) {
      return <Award size={16} className="notif-type-icon notif-award" />;
    }
    if (t.includes("GOAL")) {
      return <Target size={16} className="notif-type-icon notif-goal" />;
    }
    if (t.includes("WEEKLY")) {
      return <BarChart3 size={16} className="notif-type-icon notif-weekly" />;
    }
    return <Sparkles size={16} className="notif-type-icon notif-sparkle" />;
  };

  return (
    <header className="dashboard-header">
      {/* Left Column: Mobile Menu Toggle & Personalized Greeting */}
      <div className="header-left">
        {/* Mobile Drawer Menu Toggle */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-greeting-wrap">
          <h1 className="header-greeting-title">{greetingText}</h1>
          <p className="header-greeting-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Right Column: Actions (AI Coach, Theme, Notifications, Profile) */}
      <div className="header-right">
        {/* Ask AI Assistant */}
        {onOpenAiChat && (
          <button
            type="button"
            className="header-ai-btn"
            onClick={onOpenAiChat}
            title="Ask CarbonTrack AI Assistant"
            aria-label="Ask CarbonTrack AI Assistant"
          >
            <Bot size={17} />
            <span className="header-ai-label">AI Coach</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell & Dropdown */}
        <div className="header-notif-wrap" ref={notifsRef}>
          <button
            type="button"
            className={`header-icon-btn ${notifsOpen ? "active" : ""}`}
            onClick={() => {
              setNotifsOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            aria-label="View notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="notif-dropdown-panel" role="dialog" aria-label="Notifications Panel">
              <div className="notif-panel-header">
                <div className="notif-header-title">
                  <strong>Notifications</strong>
                  {unreadCount > 0 ? (
                    <span className="notif-unread-pill">{unreadCount} new</span>
                  ) : (
                    <span className="notif-caught-pill">All caught up</span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all-btn"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                  >
                    <Check size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="notif-panel-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <Sparkles size={26} className="notif-empty-icon" />
                    <h4>You're all caught up!</h4>
                    <p>Milestone badges, reduction achievements, and weekly digests will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-card-item ${!n.isRead ? "unread" : "read"}`}
                      onClick={() => handleMarkAsRead(n.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleMarkAsRead(n.id)}
                    >
                      <div className="notif-icon-col">
                        {getNotifIcon(n.notificationType)}
                      </div>

                      <div className="notif-body-col">
                        <div className="notif-body-top">
                          <strong className="notif-subject">{n.subject}</strong>
                          {!n.isRead && <span className="notif-unread-dot" title="Unread" />}
                        </div>
                        <p className="notif-desc">
                          {n.message || (n.notificationType ? n.notificationType.replace(/_/g, " ") : "System notice")}
                        </p>
                        <span className="notif-timestamp">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "Recent"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="header-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className={`header-user-pill ${profileOpen ? "active" : ""}`}
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifsOpen(false);
            }}
            aria-label="User account menu"
            title={userName ? `Signed in as ${userName}` : "Account"}
          >
            <UserAvatar
              src={avatarUrl}
              seed={avatarSeed || userEmail || userName}
              email={userEmail}
              name={userName}
              size={32}
            />
            <div className="header-user-meta">
              <span className="header-user-name">{userName || "Eco Champion"}</span>
              <span className="header-user-role">{userRole || "Member"}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="profile-dropdown-menu" role="menu">
              {/* User Summary Header */}
              <div className="profile-dropdown-header">
                <UserAvatar
                  src={avatarUrl}
                  seed={avatarSeed || userEmail || userName}
                  email={userEmail}
                  name={userName}
                  size={42}
                />
                <div className="profile-dropdown-info">
                  <strong className="profile-info-name">{userName || "Eco Champion"}</strong>
                  <span className="profile-info-email">{userEmail || "user@carbontrack"}</span>
                  <span className="profile-info-role-badge">
                    <Shield size={11} /> {userRole || "Member"}
                  </span>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              {/* Menu Actions */}
              <div className="profile-dropdown-items">
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate("Profile");
                  }}
                  role="menuitem"
                >
                  <User size={16} />
                  <span>View Profile & Avatar</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate("Settings");
                  }}
                  role="menuitem"
                >
                  <Settings size={16} />
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    toggleTheme();
                  }}
                  role="menuitem"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  <span>Theme: <strong>{isDark ? "Dark" : "Light"}</strong></span>
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-menu-item logout-item"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  role="menuitem"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
