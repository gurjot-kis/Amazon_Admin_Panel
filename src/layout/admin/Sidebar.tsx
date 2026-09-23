import React, { useEffect, useState } from "react";
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
  LuChevronDown,
  LuListChecks,
} from "react-icons/lu";

import { getStoredUser, clearAuthSession } from "../../utils/auth";
import { resolveMediaUrl } from "../../config/api";
import { ROUTES } from "../../routes";
import { useLayout } from "../LayoutContext";
import "../../styles/Sidebar.css";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../../store/api/baseApi";
import { useDispatch } from "react-redux";
import { MdLayers, MdTune } from "react-icons/md";

interface NavSubItem {
  id: string;
  label: string;
  path: string;
  activePaths: string[];
  icon?: React.ReactElement;
}

interface NavItem {
  id: string;
  label: string;
  path?: string;
  activePaths?: string[];
  icon: React.ReactElement;
  children?: NavSubItem[];
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
    id: "Profile",
    label: "Profile",
    path: ROUTES.profile,
    activePaths: [ROUTES.profile],
    icon: <LuUserRound size={20} />,
  },
  // {
  //   id: "Vendors",
  //   label: "Vendors",
  //   path: ROUTES.vendors,
  //   activePaths: [ROUTES.vendors],
  //   icon: <LuStore size={20} />,
  // },
  // {
  //   id: "Users",
  //   label: "Users",
  //   path: ROUTES.users,
  //   activePaths: [ROUTES.users],
  //   icon: <LuUsers size={20} />,
  // },
  {
    id: "Category",
    label: "Categories",
    path: ROUTES.categories,
    activePaths: [ROUTES.categories, "/admin/sub-categories"],
    icon: <LuFolderTree size={20} />,
  },
  {
    id: "variants",
    label: "Variants",
    icon: <MdLayers size={20} />,
    children: [
      {
        id: "variant-type",
        label: "Variant Type",
        path: ROUTES.variantType,
        activePaths: [ROUTES.variantType, "/admin/variant-type"],
        icon: <MdTune size={18} />,
      },
      {
        id: "variant-option",
        label: "Variant Option",
        path: ROUTES.variantOption,
        activePaths: [ROUTES.variantOption, "/admin/variant-option"],
        icon: <LuListChecks size={18} />,
      },
    ],
  },
  // {
  //   id: "Product",
  //   label: "Products",
  //   path: ROUTES.products,
  //   activePaths: [ROUTES.products],
  //   icon: <LuPackage size={20} />,
  // },
  // {
  //   id: "Orders",
  //   label: "Orders",
  //   path: ROUTES.orders,
  //   activePaths: [ROUTES.orders],
  //   icon: <LuShoppingBag size={20} />,
  // },
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

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          child.activePaths.some((p) => pathname.startsWith(p)),
        );
        if (isChildActive) {
          setOpenMenus((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleSubMenu = (menuId: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

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
            <span className="sidebar-brand-accent">Ever</span>Mart
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
              if (item.children && item.children.length > 0) {
                const isOpen = !!openMenus[item.id];
                const isParentActive = item.children.some((child) =>
                  child.activePaths.some((p) => pathname.startsWith(p)),
                );

                return (
                  <div key={item.id} className="sidebar-dropdown-group">
                    <button
                      type="button"
                      className={`sidebar-nav-item sidebar-parent-item ${
                        isParentActive ? "sidebar-parent-active" : ""
                      }`}
                      onClick={() => toggleSubMenu(item.id)}
                    >
                      <span className="sidebar-nav-icon">{item.icon}</span>
                      <span className="sidebar-nav-label">{item.label}</span>
                      <LuChevronDown
                        size={16}
                        className={`sidebar-arrow-icon ${isOpen ? "sidebar-arrow-open" : ""}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="sidebar-submenu-list">
                        {item.children.map((child) => {
                          const isChildActive = child.activePaths.some((p) =>
                            pathname.startsWith(p),
                          );
                          return (
                            <button
                              key={child.id}
                              type="button"
                              className={`sidebar-submenu-item ${
                                isChildActive
                                  ? "sidebar-submenu-item-active"
                                  : ""
                              }`}
                              onClick={() => handleNavClick(child.path)}
                            >
                              {child.icon && (
                                <span className="sidebar-submenu-icon">
                                  {child.icon}
                                </span>
                              )}
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Standard Item
              const isActive = item.activePaths?.some((p) =>
                pathname.startsWith(p),
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                  onClick={() => item.path && handleNavClick(item.path)}
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
