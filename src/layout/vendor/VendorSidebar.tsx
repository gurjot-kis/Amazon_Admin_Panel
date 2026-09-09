import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuUserRound,
  LuLogOut,
  LuX,
  LuCalendarClock,
} from "react-icons/lu";

import { getStoredUser, clearAuthSession } from "../../utils/auth";
import { resolveMediaUrl } from "../../config/api";
import { VENDOR_ROUTES, ROUTES } from "../../routes";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../features/auth/authSlice";
import { clearRole } from "../../features/auth/roleSlice";
import { useLayout } from "../LayoutContext";
import "../../styles/VendorSidebar.css";
import { baseApi } from "../../store/api/baseApi";

interface NavItem {
  id: string;
  label: string;
  path: string;
  activePaths: string[];
  icon: React.ReactElement;
}

interface StoredUser {
  name?: string;
  email?: string;
  profilePicture?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "Dashboard",
    label: "Dashboard",
    path: VENDOR_ROUTES.dashboard,
    activePaths: [VENDOR_ROUTES.dashboard],
    icon: <LuLayoutDashboard size={20} />,
  },
  {
    id: "Profile",
    label: "Profile",
    path: VENDOR_ROUTES.profile,
    activePaths: [VENDOR_ROUTES.profile],
    icon: <LuUserRound size={20} />,
  },
  {
    id: "Slots",
    label: "Slots",
    path: VENDOR_ROUTES.slots,
    activePaths: [VENDOR_ROUTES.slots],
    icon: <LuCalendarClock size={20} />,
  },

  // {
  //   id: "Support",
  //   label: "Support",
  //   path: VENDOR_ROUTES.support,
  //   activePaths: [VENDOR_ROUTES.support],
  //   icon: <LuLifeBuoy size={20} />,
  // },
];

export default function VendorSidebar(): React.ReactElement {
  const user = getStoredUser() as StoredUser | null;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 992) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
    dispatch(clearRole());
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`vendor-sidebar-backdrop ${isSidebarOpen ? "vendor-sidebar-backdrop-visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={`vendor-sidebar-container ${isSidebarOpen ? "vendor-sidebar-open" : ""}`}
      >
        {/* Brand / Close Header */}
        <div className="vendor-sidebar-brand-header">
          <div className="vendor-sidebar-brand-logo">
            <span className="vendor-sidebar-brand-accent">Urban</span>Clap
          </div>
          <button
            type="button"
            className="vendor-sidebar-close-btn d-lg-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="vendor-sidebar-user-card">
          <div className="vendor-sidebar-avatar-wrapper">
            {user?.profilePicture ? (
              <img
                src={resolveMediaUrl(user.profilePicture)}
                alt={user?.name || "Vendor Avatar"}
                className="vendor-sidebar-avatar-img"
              />
            ) : (
              <div className="vendor-sidebar-avatar-fallback">
                {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
              </div>
            )}
            <span className="vendor-sidebar-status-badge" />
          </div>
          <div className="vendor-sidebar-user-info">
            <p className="vendor-sidebar-user-name">
              {user?.name || "Vendor Partner"}
            </p>
            <p className="vendor-sidebar-user-role">
              {user?.email || "vendor@domain.com"}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="vendor-sidebar-nav-wrapper">
          <span className="vendor-sidebar-nav-heading">
            Vendor Control Panel
          </span>
          <nav className="vendor-sidebar-nav-list">
            {NAV_ITEMS.map((item) => {
              const isActive = item.activePaths.some((p) =>
                pathname.startsWith(p),
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`vendor-sidebar-nav-item ${isActive ? "vendor-sidebar-nav-item-active" : ""}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <span className="vendor-sidebar-nav-icon">{item.icon}</span>
                  <span className="vendor-sidebar-nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="vendor-sidebar-footer">
          <button
            type="button"
            className="vendor-sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LuLogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
