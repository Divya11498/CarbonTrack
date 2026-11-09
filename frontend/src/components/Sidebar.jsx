import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Target,
  Trophy,
  Building2,
  Leaf,
  UserRound,
  LogOut,
  Lightbulb,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import CarbonTrackLogo from "./CarbonTrackLogo";

const menuItems = [
  { label: "Dashboard", id: "Dashboard", icon: LayoutDashboard },
  { label: "Log Activities", id: "Log Activities", icon: ClipboardList },
  { label: "Analytics", id: "Analytics", icon: BarChart3 },
  { label: "Goals", id: "Goals", icon: Target },
  { label: "Recommendations", id: "Recommendations", icon: Lightbulb },
  { label: "Leaderboard", id: "Leaderboard", icon: Trophy },
  { label: "Achievements", id: "Achievements", icon: Award },
  { label: "Organisation", id: "Organisation", icon: Building2 },
];

const secondaryItems = [
  { label: "Profile", id: "Profile", icon: UserRound },
  { label: "Settings", id: "Settings", icon: Settings },
];

export default function Sidebar({
  activePage,
  onNavigate,
  userName = "User",
  avatarUrl = "",
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (id) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Top Header / Brand */}
        <div className="sidebar-brand-wrapper">
          <div
            className="sidebar-brand"
            onClick={() => handleNavClick("Dashboard")}
            title="CarbonTrack"
          >
            <CarbonTrackLogo size={26} showText={!collapsed} />
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="desktop-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          <div className="nav-group">
            {!collapsed && <span className="nav-group-title">MAIN MENU</span>}
            {menuItems.map(({ label, id, icon: Icon }) => {
              const isActive = activePage === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavClick(id)}
                  title={collapsed ? label : ""}
                >
                  <Icon size={19} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{label}</span>}
                  {isActive && <span className="active-glow-indicator" />}
                </button>
              );
            })}
          </div>

          <div className="nav-group secondary-group">
            {!collapsed && <span className="nav-group-title">PREFERENCES</span>}
            {secondaryItems.map(({ label, id, icon: Icon }) => {
              const isActive = activePage === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavClick(id)}
                  title={collapsed ? label : ""}
                >
                  <Icon size={19} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer User Card & Logout */}
        <div className="sidebar-footer">
          <div
            className="sidebar-user-card"
            onClick={() => handleNavClick("Profile")}
            title="View Profile"
          >
            <div className="sidebar-user-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="avatar-img" />
              ) : (
                <UserRound size={18} />
              )}
            </div>

            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">Eco Member</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={onLogout}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
