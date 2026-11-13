import { useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Target,
  Trophy,
  Building2,
  Settings,
  LogOut,
  Award,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Sun,
  Moon,
} from "lucide-react";
import CarbonTrackLogo from "./CarbonTrackLogo";
import UserAvatar from "./UserAvatar";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Log Activities", label: "Activity Logging", icon: PlusCircle },
  { id: "Analytics", label: "Analytics", icon: BarChart3 },
  { id: "Goals", label: "Goals", icon: Target },
  { id: "Achievements", label: "Achievements", icon: Award },
  { id: "Leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "Organisation", label: "Organization", icon: Building2 },
  { id: "Recommendations", label: "AI Recommendations", icon: Sparkles },
];

export default function Sidebar({
  activePage,
  onNavigate,
  onLogout,
  userName,
  userEmail,
  avatarUrl,
  avatarSeed,
  userRole,
  mobileOpen,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}) {
  const { isDark, toggleTheme } = useTheme();

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => onCloseMobile && onCloseMobile()}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Primary Navigation"
      >
        {/* =========================================================
            TOP SECTION: Logo, Brand & ChatGPT-Style Toggle Button
            ========================================================= */}
        <div className="sidebar-header">
          {collapsed ? (
            /* Collapsed Mode: Centered Expand Button */
            <div className="sidebar-collapsed-header">
              <button
                type="button"
                className="desktop-collapse-btn"
                onClick={handleToggle}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                data-tooltip="Expand sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          ) : (
            /* Expanded Mode: Logo + Brand Name + Small Collapse Toggle Button Beside Logo */
            <>
              <div
                className="sidebar-brand"
                onClick={() => handleNavClick("Dashboard")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleNavClick("Dashboard")}
                title="CarbonTrack Dashboard"
              >
                <CarbonTrackLogo size={28} showText={false} />
                <span className="brand-name">CarbonTrack</span>
              </div>

              {/* Small Desktop Toggle Button Beside Logo */}
              <button
                type="button"
                className="desktop-collapse-btn"
                onClick={handleToggle}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                data-tooltip="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          )}

          {/* Mobile Close Button (visible only in mobile drawer mode) */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => onCloseMobile && onCloseMobile()}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================================================
            MAIN NAVIGATION: 8 items, uniform height, transparent scroll
            ========================================================= */}
        <nav className="sidebar-nav" aria-label="Main Application Links">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                aria-label={item.label}
                data-tooltip={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} className="nav-icon" />
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* =========================================================
            BOTTOM ACCOUNT SECTION: Profile, Settings, Theme, Sign Out
            ========================================================= */}
        <div className="sidebar-footer">
          {/* User Profile Card / Avatar */}
          <div
            className="sidebar-user-card"
            onClick={() => handleNavClick("Profile")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleNavClick("Profile")}
            title={userName ? `Signed in as ${userName}` : "View Profile"}
            data-tooltip={collapsed ? (userName || "Profile") : undefined}
          >
            <UserAvatar
              src={avatarUrl}
              seed={avatarSeed || userEmail || userName}
              email={userEmail}
              name={userName}
              size={32}
            />
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="user-name">{userName || "Eco Champion"}</span>
                <span className="user-role">{userRole || "Member"}</span>
              </div>
            )}
          </div>

          {/* Settings Shortcut */}
          <button
            type="button"
            className={`sidebar-footer-btn ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => handleNavClick("Settings")}
            title="Settings"
            aria-label="Settings"
            data-tooltip={collapsed ? "Settings" : undefined}
          >
            <Settings size={18} className="footer-btn-icon" />
            {!collapsed && <span>Settings</span>}
          </button>

          {/* Theme Mode Toggle */}
          <button
            type="button"
            className="sidebar-footer-btn theme-mode-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            data-tooltip={collapsed ? (isDark ? "Light Theme" : "Dark Theme") : undefined}
          >
            {isDark ? (
              <Sun size={18} className="footer-btn-icon" />
            ) : (
              <Moon size={18} className="footer-btn-icon" />
            )}
            {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            className="sidebar-footer-btn logout-btn"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            data-tooltip={collapsed ? "Sign Out" : undefined}
          >
            <LogOut size={18} className="footer-btn-icon" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
