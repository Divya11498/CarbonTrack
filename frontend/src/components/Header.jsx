import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Bell,
  UserRound,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Header({
  userName = "User",
  avatarUrl = "",
  onNavigate,
  onLogout,
  onToggleMobileSidebar,
}) {
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={22} />
        </button>

        <div className="header-greeting">
          <h2>
            {getGreeting()}, <span className="greeting-name">{userName}</span>
          </h2>
        </div>
      </div>

      <div className="header-right">
        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          className="header-action-btn theme-toggle"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={20} className="text-lime" /> : <Moon size={20} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="header-dropdown-wrap" ref={notificationRef}>
          <button
            type="button"
            className="header-action-btn notification-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="notification-badge-dot"></span>
          </button>

          {notificationsOpen && (
            <div className="notification-popover">
              <div className="popover-header">
                <h4>Notifications</h4>
                <span className="badge-pill-green">2 New</span>
              </div>
              <div className="notification-list">
                <div className="notification-item unread">
                  <div className="notif-icon bg-emerald">
                    <Sparkles size={16} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">Weekly Goal On Track!</p>
                    <p className="notif-time">You reduced transport CO₂e by 18% this week.</p>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notif-icon bg-green">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">New Achievement Unlocked</p>
                    <p className="notif-time">You earned the 'Eco Pioneer' badge.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="header-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="header-user-btn"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotificationsOpen(false);
            }}
            aria-expanded={dropdownOpen}
          >
            <div className="header-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="avatar-img" />
              ) : (
                <span className="avatar-initials">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="header-user-name">{userName}</span>
            <ChevronDown size={15} className={`chevron-icon ${dropdownOpen ? "rotate" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{userName}</strong>
                <span>Personal Account</span>
              </div>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigate("Profile");
                }}
              >
                <UserRound size={17} />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigate("Settings");
                }}
              >
                <Settings size={17} />
                <span>Settings</span>
              </button>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                className="dropdown-item text-danger"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={17} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
