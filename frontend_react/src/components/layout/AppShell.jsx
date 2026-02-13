import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  ShieldAlert,
  Bot,
  Settings,
  Menu,
  X,
  LogOut,
  Activity,
} from "lucide-react";
import aegisLogo from "../../assets/aegis-logo.png";
import { useAuth } from "../../context/AuthContext";
import "../../index.css";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
  { key: "ml-detection", label: "ML Detection", path: "/ml-detection", Icon: Activity },
  { key: "ids", label: "IDS Alerts", path: "/ids", Icon: ShieldAlert },
  { key: "pentesting", label: "Pentesting", path: "/pentest", Icon: Shield },
  { key: "chatbot", label: "Security Assistant", path: "/chatbot", Icon: Bot },
  { key: "settings", label: "Settings", path: "/settings", Icon: Settings },
];

function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div
      className={`aegis-shell ${isCollapsed ? "aegis-shell--collapsed" : ""}`}
    >
      {/* Mobile Menu Toggle Button */}
      <button
        className="aegis-mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop */}
      <div
        className={`aegis-sidebar-backdrop ${mobileMenuOpen ? "active" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`aegis-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        {/* Logo Section */}
        <div className="aegis-sidebar-logo-section">
          <img
            src={aegisLogo}
            alt="Aegis"
            className={`aegis-sidebar-logo ${isCollapsed ? "aegis-sidebar-logo--collapsed" : ""}`}
          />
        </div>

        <div className="aegis-sidebar-search">
          <input className="aegis-sidebar-search-input" placeholder="Search for..." />
        </div>

        <nav className="aegis-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const { Icon } = item;
            return (
              <button
                key={item.key}
                type="button"
                className={`aegis-nav-item${isActive ? " aegis-nav-item--active" : ""}`}
                onClick={() => navigate(item.path)}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span className="aegis-nav-active-bar" aria-hidden="true" />
                )}
                <span className="aegis-nav-icon">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="aegis-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="aegis-sidebar-footer">
          <div className="aegis-user-pill">
            <div className="aegis-user-avatar">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="aegis-user-meta">
              <div className="aegis-user-name">{user?.email || "User"}</div>
              <div className="aegis-user-role">Security Analyst</div>
            </div>
          </div>
          <button
            type="button"
            className="aegis-logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={16} />
            {!isCollapsed && <span className="aegis-logout-label">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="aegis-main">{children}</main>
    </div>
  );
}

export default AppShell;



