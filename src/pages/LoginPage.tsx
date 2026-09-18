import React, { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LuMail, LuLock, LuEye, LuEyeOff, LuShieldCheck } from "react-icons/lu";

import { ROUTES } from "../routes";
import { getStoredToken, getStoredUser, setAuthSession } from "../utils/auth";
import { getPostLoginRoute } from "../utils/roles";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../features/auth/authSlice";
import { setRole } from "../features/auth/roleSlice";
import { useAdminLoginMutation } from "../features/auth/authApi";
import "../styles/LoginPage.css";

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [adminLogin, { isLoading }] = useAdminLoginMutation();

  if (getStoredToken()) {
    return <Navigate to={getPostLoginRoute(getStoredUser()?.role)} replace />;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Validation error", {
        description: "Please enter both your email address and password.",
      });
      return;
    }

    try {
      const response = await adminLogin({
        email: email.trim(),
        password: password.trim(),
      }).unwrap();
      const authData = response?.data;

      if (!authData) {
        throw new Error(
          response?.message || "Invalid response received from server.",
        );
      }

      // Handle both nested user response ({ user: {...}, token }) and flat response
      const rawData = authData as any;
      const userPayload = rawData.user || rawData;

      const authUser = {
        ...userPayload,
        _id: String(userPayload._id || userPayload.user_id || ""),
        user_id: String(userPayload.user_id || userPayload._id || ""),
        name: String(userPayload.name || userPayload.fullName || "Admin"),
        email: String(userPayload.email || email.trim()),
        role: String(userPayload.role || rawData.role || "admin"),
        profilePicture:
          userPayload.profilePicture ||
          userPayload.profile_picture ||
          userPayload.avatar ||
          rawData.profilePicture ||
          "",
        token: String(rawData.token || userPayload.token || ""),
      };

      // Store in LocalStorage / Cookie Session
      setAuthSession(authUser);

      // Sync Redux Auth Store
      dispatch(
        setCredentials({
          user: {
            _id: authUser._id,
            name: authUser.name,
            phone: userPayload.phone || authUser.email,
            gender: userPayload.gender || "unknown",
            status: userPayload.status?.toString() || "active",
            avatar: authUser.profilePicture,
            createdAt: userPayload.createdAt || new Date().toISOString(),
            updatedAt: userPayload.updatedAt || new Date().toISOString(),
            token: authUser.token,
          },
          token: authUser.token,
        }),
      );

      // Sync Redux Role Store
      dispatch(setRole(authUser.role as "SuperAdmin" | "Vendor"));

      toast.success("Login successful");

      navigate(getPostLoginRoute(authUser.role), { replace: true });
    } catch (err: any) {
      console.error("Login failed:", err);
      const errMsg =
        err?.data?.message ||
        err?.message ||
        "Invalid credentials. Please verify and try again.";

      toast.error("Authentication failed", {
        description: errMsg,
      });
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Decorative ambient background accents */}
      <div className="login-ambient-shape login-ambient-shape-1" />
      <div className="login-ambient-shape login-ambient-shape-2" />

      <div className="login-card-container">
        {/* Header Branding */}
        <div className="login-card-header">
          <div className="login-logo-badge">
            <LuShieldCheck size={28} />
          </div>
          <h2 className="login-brand-title">
            <span>Ever</span>Mart
          </h2>
          {/* <p className="login-brand-subtitle">
            Enter your credentials to access the admin portal.
          </p> */}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form-body">
          {/* Email Field */}
          <div className="login-input-group">
            <label className="login-input-label" htmlFor="loginEmail">
              Email Address
            </label>
            <div className="login-field-box">
              <LuMail className="login-field-icon" size={18} />
              <input
                id="loginEmail"
                type="email"
                className="login-input-control"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-input-group">
            <div className="login-label-row">
              <label className="login-input-label" htmlFor="loginPassword">
                Password
              </label>
              <Link to={ROUTES.forgotPassword} className="login-forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="login-field-box">
              <LuLock className="login-field-icon" size={18} />
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                className="login-input-control login-input-control--password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-eye"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="login-btn-loading">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* <div className="login-card-footer">
          <span>Protected system • Authorized personnel only</span>
        </div> */}
      </div>
    </div>
  );
}
