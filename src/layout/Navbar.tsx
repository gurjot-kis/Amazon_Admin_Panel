import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuArrowLeft,
  LuMenu,
  LuUser,
  LuLogOut,
  LuChevronDown,
  LuShieldCheck,
} from "react-icons/lu";
import { useDispatch } from "react-redux";
import { useLayout } from "./LayoutContext";
import { getStoredUser, clearAuthSession } from "../utils/auth";
import { resolveMediaUrl } from "../config/api";
import { logout } from "../features/auth/authSlice";
import { baseApi } from "../store/api/baseApi";
import { ROUTES, VENDOR_ROUTES } from "../routes";

interface StoredUser {
  name?: string;
  email?: string;
  profilePicture?: string;
}

export default function Navbar(): React.ReactElement {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { headerConfig, setIsSidebarOpen } = useLayout();
  const user = getStoredUser() as StoredUser | null;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isVendor = pathname.startsWith("/vendor");

  const profileRoute = isVendor ? VENDOR_ROUTES.profile : ROUTES.profile;
  const roleLabel = isVendor ? "Vendor Partner" : "Admin Access";

  // Take only the first name (e.g. "Gurjot")
  const firstName = user?.name ? user.name.trim().split(" ")[0] : "Admin";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="navbar-clay-header">
      {/* Left: Hamburger (mobile), Back Button & Headings */}
      <div className="d-flex align-items-center gap-2 gap-md-3">
        <button
          type="button"
          className="navbar-clay-btn d-lg-none"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <LuMenu size={20} />
        </button>

        {headerConfig.backTo && (
          <button
            type="button"
            className="navbar-clay-btn"
            onClick={() => navigate(headerConfig.backTo!)}
            title={headerConfig.backTitle || "Back"}
          >
            <LuArrowLeft size={18} />
          </button>
        )}

        <div>
          <h1 className="navbar-title">{headerConfig.title || "Dashboard"}</h1>
          {headerConfig.subtitle && (
            <p className="navbar-subtitle">{headerConfig.subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Floating Profile Trigger */}
      <div className="position-relative" ref={dropdownRef}>
        <button
          type="button"
          className={`navbar-clay-profile-trigger ${isDropdownOpen ? "active" : ""}`}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-expanded={isDropdownOpen}
        >
          <div className="navbar-avatar-wrapper">
            {user?.profilePicture ? (
              <img
                src={resolveMediaUrl(user.profilePicture)}
                alt={firstName}
                className="navbar-avatar-img"
              />
            ) : (
              <div className="navbar-avatar-fallback">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="navbar-status-badge" />
          </div>

          <span className="navbar-user-short-name">{firstName}</span>

          <LuChevronDown
            size={14}
            className={`navbar-trigger-arrow ${isDropdownOpen ? "rotated" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="navbar-clay-dropdown-menu">
            <div className="navbar-dropdown-user-header">
              <div className="navbar-avatar-wrapper-lg">
                {user?.profilePicture ? (
                  <img
                    src={resolveMediaUrl(user.profilePicture)}
                    alt={user?.name || "Avatar"}
                    className="navbar-avatar-img"
                  />
                ) : (
                  <div className="navbar-avatar-fallback">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
              </div>
              <div className="navbar-dropdown-user-details">
                <p className="navbar-dropdown-name">
                  {user?.name || "Administrator"}
                </p>
                <p className="navbar-dropdown-email">
                  {user?.email || "admin@evermart.com"}
                </p>
                <div className="navbar-dropdown-role-tag">
                  <LuShieldCheck size={13} />
                  <span>{roleLabel}</span>
                </div>
              </div>
            </div>

            <div className="navbar-dropdown-divider" />

            <div className="navbar-dropdown-actions">
              <button
                type="button"
                className="navbar-dropdown-btn"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate(profileRoute);
                }}
              >
                <LuUser size={16} />
                <span>Account Profile</span>
              </button>

              <button
                type="button"
                className="navbar-dropdown-btn navbar-dropdown-logout-btn"
                onClick={handleLogout}
              >
                <LuLogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
