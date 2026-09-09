import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuStore,
  LuUsers,
  LuUserRound,
  LuFolderTree,
  LuPackage,
  LuShoppingBag,
  LuLogOut,
  LuX,
  LuLifeBuoy,
} from "react-icons/lu";

import { getStoredUser, clearAuthSession } from "../../utils/auth";
import { resolveMediaUrl } from "../../config/api";
import { ROUTES } from "../../routes";
import { useLayout } from "../LayoutContext";
import "../../styles/Sidebar.css";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../../store/api/baseApi";
import { useDispatch } from "react-redux";

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
    path: ROUTES.dashboard,
    activePaths: [ROUTES.dashboard],
    icon: <LuLayoutDashboard size={20} />,
  },
  {
    id: "Vendors",
    label: "Vendors",
    path: ROUTES.vendors,
    activePaths: [ROUTES.vendors],
    icon: <LuStore size={20} />,
  },
  {
    id: "Users",
    label: "Users",
    path: ROUTES.users,
    activePaths: [ROUTES.users],
    icon: <LuUsers size={20} />,
  },
  {
    id: "Profile",
    label: "Profile",
    path: ROUTES.profile,
    activePaths: [ROUTES.profile],
    icon: <LuUserRound size={20} />,
  },
  {
    id: "Category",
    label: "Categories",
    path: ROUTES.categories,
    activePaths: [ROUTES.categories, "/admin/sub-categories"],
    icon: <LuFolderTree size={20} />,
  },
  {
    id: "Product",
    label: "Products",
    path: ROUTES.products,
    activePaths: [ROUTES.products],
    icon: <LuPackage size={20} />,
  },
  {
    id: "Orders",
    label: "Orders",
    path: ROUTES.orders,
    activePaths: [ROUTES.orders],
    icon: <LuShoppingBag size={20} />,
  },
  // {
  //   id: "Support",
  //   label: "Support",
  //   path: ROUTES.support,
  //   activePaths: [ROUTES.support],
  //   icon: <LuLifeBuoy size={20} />,
  // },
];

export default function Sidebar(): React.ReactElement {
  const user = getStoredUser() as StoredUser | null;
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "sidebar-backdrop-visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={`sidebar-container ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        {/* Brand / Close Header */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-logo">
            <span className="sidebar-brand-accent">Urban</span>Clap
          </div>
          <button
            type="button"
            className="sidebar-close-btn d-lg-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar-wrapper">
            {user?.profilePicture ? (
              <img
                src={resolveMediaUrl(user.profilePicture)}
                alt={user?.name || "User Avatar"}
                className="sidebar-avatar-img"
              />
            ) : (
              <div className="sidebar-avatar-fallback">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <span className="sidebar-status-badge" />
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name || "Administrator"}</p>
            <p className="sidebar-user-role">
              {user?.email || "admin@domain.com"}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="sidebar-nav-wrapper">
          <span className="sidebar-nav-heading">Main Navigation</span>
          <nav className="sidebar-nav-list">
            {NAV_ITEMS.map((item) => {
              const isActive = item.activePaths.some((p) =>
                pathname.startsWith(p),
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
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
