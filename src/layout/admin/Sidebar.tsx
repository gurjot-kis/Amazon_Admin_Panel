import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuStore,
  LuUserRound,
  LuFolderTree,
  LuLogOut,
  LuX,
  LuChevronDown,
  LuListChecks,
  LuShoppingCart,
  LuContactRound,
  LuTicketPercent,
  LuSettings,
  LuWallet,
  LuUsers,
} from "react-icons/lu";
import { MdLayers, MdTune } from "react-icons/md";
import { useDispatch } from "react-redux";

import { clearAuthSession } from "../../utils/auth";
import { ROUTES } from "../../routes";
import { useLayout } from "../LayoutContext";
import "../../styles/Sidebar.css";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../../store/api/baseApi";

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

const NAV_ITEMS: NavItem[] = [
  {
    id: "Dashboard",
    label: "Dashboard",
    path: ROUTES.dashboard,
    activePaths: [ROUTES.dashboard],
    icon: <LuLayoutDashboard size={19} />,
  },
  {
    id: "Profile",
    label: "Profile",
    path: ROUTES.profile,
    activePaths: [ROUTES.profile],
    icon: <LuUserRound size={19} />,
  },
  {
    id: "Vendors",
    label: "Vendors",
    path: ROUTES.vendors,
    activePaths: [ROUTES.vendors],
    icon: <LuContactRound size={19} />,
  },
  {
    id: "Users",
    label: "Users",
    path: ROUTES.users,
    activePaths: [ROUTES.users],
    icon: <LuUsers size={19} />,
  },
  {
    id: "Stores",
    label: "Stores",
    path: ROUTES.stores,
    activePaths: [ROUTES.stores],
    icon: <LuStore size={19} />,
  },
  {
    id: "Category",
    label: "Categories",
    path: ROUTES.categories,
    activePaths: [ROUTES.categories, "/admin/sub-categories"],
    icon: <LuFolderTree size={19} />,
  },
  {
    id: "variants",
    label: "Variants",
    icon: <MdLayers size={19} />,
    children: [
      {
        id: "variant-type",
        label: "Variant Type",
        path: ROUTES.variantType,
        activePaths: [ROUTES.variantType, "/admin/variant-type"],
        icon: <MdTune size={17} />,
      },
      {
        id: "variant-option",
        label: "Variant Option",
        path: ROUTES.variantOption,
        activePaths: [ROUTES.variantOption, "/admin/variant-option"],
        icon: <LuListChecks size={17} />,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <LuSettings size={19} />,
    children: [
      {
        id: "CartSettings",
        label: "Cart Settings",
        path: ROUTES.cartSettings,
        activePaths: [ROUTES.cartSettings],
        icon: <LuShoppingCart size={17} />,
      },
      {
        id: "wallet-settings",
        label: "Wallet",
        path: ROUTES.walletSettings,
        activePaths: [ROUTES.walletSettings, "/admin/wallet-settings"],
        icon: <LuWallet size={17} />,
      },
    ],
  },
  {
    id: "Coupons",
    label: "Coupons",
    path: ROUTES.couponList,
    activePaths: [ROUTES.couponList],
    icon: <LuTicketPercent size={19} />,
  },
];

export default function Sidebar(): React.ReactElement {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();

  // Accordion state: holds the single open menu ID or null
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const activeParent = NAV_ITEMS.find((item) =>
      item.children?.some((child) =>
        child.activePaths.some((p) => pathname.startsWith(p)),
      ),
    );
    // Automatically close submenus if navigating to a non-child route like Profile
    setOpenMenuId(activeParent ? activeParent.id : null);
  }, [pathname]);

  const toggleSubMenu = (menuId: string) => {
    setOpenMenuId((prev) => (prev === menuId ? null : menuId));
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
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <Link to={ROUTES.dashboard} className="sidebar-brand-logo-link">
            <div className="sidebar-logo-icon">E</div>
            <span className="sidebar-brand-logo">
              <span className="sidebar-brand-accent">Ever</span>Mart
            </span>
            <span className="sidebar-brand-badge">Admin</span>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn d-lg-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="sidebar-nav-wrapper">
          <span className="sidebar-nav-heading">Main Navigation</span>
          <nav className="sidebar-nav-list">
            {NAV_ITEMS.map((item) => {
              if (item.children && item.children.length > 0) {
                const isOpen = openMenuId === item.id;
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
                        size={15}
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

        {/* Clean Footer Sign Out */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LuLogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
