import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuUserRound,
  LuLogOut,
  LuX,
  LuPackage,
  LuStore,
  LuTicketPercent,
  LuShoppingBag,
} from "react-icons/lu";

import { clearAuthSession } from "../../utils/auth";
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

const NAV_ITEMS: NavItem[] = [
  {
    id: "Dashboard",
    label: "Dashboard",
    path: VENDOR_ROUTES.dashboard,
    activePaths: [VENDOR_ROUTES.dashboard],
    icon: <LuLayoutDashboard size={19} />,
  },
  {
    id: "Profile",
    label: "Profile",
    path: VENDOR_ROUTES.profile,
    activePaths: [VENDOR_ROUTES.profile],
    icon: <LuUserRound size={19} />,
  },
  {
    id: "Product",
    label: "Products",
    path: VENDOR_ROUTES.products,
    activePaths: [VENDOR_ROUTES.products],
    icon: <LuPackage size={19} />,
  },
  {
    id: "Stores",
    label: "Stores",
    path: VENDOR_ROUTES.stores,
    activePaths: [VENDOR_ROUTES.stores],
    icon: <LuStore size={19} />,
  },
  {
    id: "Coupons",
    label: "Coupons",
    path: VENDOR_ROUTES.couponList,
    activePaths: [VENDOR_ROUTES.couponList],
    icon: <LuTicketPercent size={19} />,
  },
  {
    id: "Orders",
    label: "Orders",
    path: VENDOR_ROUTES.orders,
    activePaths: [VENDOR_ROUTES.orders],
    icon: <LuShoppingBag size={19} />,
  },
];

export default function VendorSidebar(): React.ReactElement {
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
        {/* Brand Header with Emerald Icon & Vendor Badge */}
        <div className="vendor-sidebar-brand-header">
          <Link
            to={VENDOR_ROUTES.dashboard}
            className="vendor-sidebar-brand-logo-link"
          >
            <div className="vendor-sidebar-logo-icon">E</div>
            <span className="vendor-sidebar-brand-logo">
              <span className="vendor-sidebar-brand-accent">Ever</span>Mart
            </span>
            <span className="vendor-sidebar-brand-badge">Vendor</span>
          </Link>
          <button
            type="button"
            className="vendor-sidebar-close-btn d-lg-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <LuX size={18} />
          </button>
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

        {/* Clean Footer Sign Out */}
        <div className="vendor-sidebar-footer">
          <button
            type="button"
            className="vendor-sidebar-logout-btn"
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
