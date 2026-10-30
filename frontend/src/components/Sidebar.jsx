
import {
    LayoutDashboard,
    ClipboardList,
    Target,
    Trophy,
    Building2,
    Leaf,
    Award,
    Lightbulb,
    LogOut,
    UserRound,
} from "lucide-react";

const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Log Activities", icon: ClipboardList },
    { label: "Goals", icon: Target },
    { label: "Recommendations", icon: Lightbulb },
    { label: "Achievements", icon: Award },
    { label: "Leaderboard", icon: Trophy },
    { label: "Organisation", icon: Building2 },
];

export default function Sidebar({
                                    activePage,
                                    onNavigate,
                                    userName,
                                    onLogout,
                                }) {
    return (
        <aside className="sidebar">
            <h2 className="brand">
                <Leaf size={26} />
                <span>CarbonTrack</span>
            </h2>

            <nav className="sidebar-nav">
                {menuItems.map(({ label, icon: Icon }) => (
                    <button
                        key={label}
                        type="button"
                        className={`nav-item ${
                            activePage === label ? "active" : ""
                        }`}
                        onClick={() => onNavigate(label)}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <p className="sidebar-footer">
                    Track less. Sustain more.
                </p>

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        <UserRound size={21} />
                    </div>

                    <div className="sidebar-user-details">
            <span className="sidebar-welcome">
              Welcome back!
            </span>

                        <span className="sidebar-user-name">
              {userName || "User"}
            </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={onLogout}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
