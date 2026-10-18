
import {
  LayoutDashboard,
  ClipboardList,
  Target,
  Trophy,
  Building2,
  Leaf
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Log Activities", icon: ClipboardList },
  { label: "Goals", icon: Target },
  { label: "Leaderboard", icon: Trophy },
  { label: "Organisation", icon: Building2 }
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <h2 className="brand">
        <Leaf size={26} />
        CarbonTrack
      </h2>

      <nav>
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

      <p className="sidebar-footer">
        Track less. Sustain more.
      </p>
    </aside>
  );
}
