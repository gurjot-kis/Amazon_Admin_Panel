import React, { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LuMail, LuKeyRound, LuArrowLeft } from "react-icons/lu";

import { ROUTES } from "../routes";
import { getStoredToken, getStoredUser } from "../utils/auth";
import { getPostLoginRoute } from "../utils/roles";
import { useForgotPasswordMutation } from "../features/auth/authApi";
import "../styles/ForgotPasswordPage.css";

export default function ForgotPasswordPage(): React.ReactElement {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  if (getStoredToken()) {
    return <Navigate to={getPostLoginRoute(getStoredUser()?.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Validation error", {
        description: "Please enter your email address.",
      });
      return;
    }

    try {
      await forgotPassword({ email: trimmedEmail }).unwrap();

      toast.success("OTP sent", {
        description:
          "Please check your email for the one-time verification code.",
      });

      navigate(ROUTES.verifyOtp || "/verify-otp", {
        state: { email: trimmedEmail },
      });
    } catch (err: any) {
      console.error("Forgot password failed:", err);

      const errMsg =
        err?.data?.message ||
        err?.message ||
        "Failed to send OTP. Please try again.";

      toast.error("Request failed", {
        description: errMsg,
      });
    }
  };

  return (
    <div className="forgot-password-page-wrapper">
      <div className="forgot-password-ambient-shape forgot-password-ambient-shape-1" />
      <div className="forgot-password-ambient-shape forgot-password-ambient-shape-2" />

      <div className="forgot-password-card-container">
        <div className="forgot-password-card-header">
          <div className="forgot-password-logo-badge">
            <LuKeyRound size={26} />
          </div>

          <h2 className="forgot-password-brand-title">
            Forgot <span>Password</span>
          </h2>

          <p className="forgot-password-brand-subtitle">
            Enter your registered email address to receive a one-time
            verification code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form-body">
          <div className="forgot-password-input-group">
            <label
              className="forgot-password-input-label"
              htmlFor="forgotPasswordEmail"
            >
              Email Address
            </label>

            <div className="forgot-password-field-box">
              <LuMail className="forgot-password-field-icon" size={18} />

              <input
                id="forgotPasswordEmail"
                type="email"
                className="forgot-password-input-control"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            className="forgot-password-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="forgot-password-btn-loading">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                />
                <span>Sending OTP...</span>
              </div>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>

        <div className="forgot-password-card-footer">
          <Link
            to={ROUTES.login || "/login"}
            className="forgot-password-back-link"
          >
            <LuArrowLeft size={15} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
