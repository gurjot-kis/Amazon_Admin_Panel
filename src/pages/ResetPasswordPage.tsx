import React, { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LuLock,
  LuEye,
  LuEyeOff,
  LuShieldCheck,
  LuArrowLeft,
} from "react-icons/lu";

import { ROUTES } from "../routes";
import { getStoredToken, getStoredUser } from "../utils/auth";
import { getPostLoginRoute } from "../utils/roles";
import { useResetPasswordMutation } from "../features/auth/authApi";
import "../styles/ResetPasswordPage.css";

interface LocationState {
  resetToken?: string;
}

export default function ResetPasswordPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = (location.state as LocationState)?.resetToken ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  if (getStoredToken()) {
    return <Navigate to={getPostLoginRoute(getStoredUser()?.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Validation error", {
        description: "Passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Validation error", {
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (!resetToken) {
      toast.error("Session error", {
        description:
          "Reset token is missing. Please restart the forgot password process.",
      });
      return;
    }

    try {
      await resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      }).unwrap();

      setIsSuccess(true);

      toast.success("Password reset successful", {
        description: "Redirecting you to login...",
      });

      setTimeout(() => {
        navigate(ROUTES.login || "/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error("Password reset failed:", err);

      const errMsg =
        err?.data?.message ||
        err?.message ||
        "Failed to reset password. Please try again.";

      toast.error("Reset failed", {
        description: errMsg,
      });
    }
  };

  return (
    <div className="reset-password-page-wrapper">
      <div className="reset-password-ambient-shape reset-password-ambient-shape-1" />
      <div className="reset-password-ambient-shape reset-password-ambient-shape-2" />

      <div className="reset-password-card-container">
        <div className="reset-password-card-header">
          <div className="reset-password-logo-badge">
            <LuShieldCheck size={28} />
          </div>

          <h2 className="reset-password-brand-title">
            Reset <span>Password</span>
          </h2>

          <p className="reset-password-brand-subtitle">
            Choose a strong new password to secure your account.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="reset-password-form-body">
            <div className="reset-password-input-group">
              <label
                className="reset-password-input-label"
                htmlFor="resetNewPassword"
              >
                New Password
              </label>

              <div className="reset-password-field-box">
                <LuLock className="reset-password-field-icon" size={18} />

                <input
                  id="resetNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="reset-password-input-control reset-password-input-control--password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="reset-password-toggle-eye"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <LuEyeOff size={18} />
                  ) : (
                    <LuEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="reset-password-input-group">
              <label
                className="reset-password-input-label"
                htmlFor="resetConfirmPassword"
              >
                Confirm Password
              </label>

              <div className="reset-password-field-box">
                <LuLock className="reset-password-field-icon" size={18} />

                <input
                  id="resetConfirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="reset-password-input-control reset-password-input-control--password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="reset-password-toggle-eye"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <LuEyeOff size={18} />
                  ) : (
                    <LuEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="reset-password-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="reset-password-btn-loading">
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />
                  <span>Resetting...</span>
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        ) : (
          <div className="reset-password-success-state">
            <div className="reset-password-success-icon">✓</div>

            <h3 className="reset-password-success-heading">Password Reset!</h3>

            <p className="reset-password-success-text">
              Your password has been successfully updated. Redirecting you to
              login...
            </p>
          </div>
        )}

        <div className="reset-password-card-footer">
          <Link
            to={ROUTES.login || "/login"}
            className="reset-password-back-link"
          >
            <LuArrowLeft size={15} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
