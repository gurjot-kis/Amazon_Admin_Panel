import React, {
  useState,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LuMail, LuShieldCheck, LuArrowLeft } from "react-icons/lu";

import { ROUTES } from "../routes";
import { getStoredToken, getStoredUser } from "../utils/auth";
import { getPostLoginRoute } from "../utils/roles";
import { useVerifyOtpMutation } from "../features/auth/authApi";
import "../styles/VerifyOtpPage.css";

interface LocationState {
  email?: string;
}

const OTP_LENGTH = 6;

export default function VerifyOtpPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const prefillEmail = (location.state as LocationState)?.email ?? "";

  const [email, setEmail] = useState(prefillEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );

  const [otpStatus, setOtpStatus] = useState<"idle" | "error" | "success">(
    "idle",
  );

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (getStoredToken()) {
    return <Navigate to={getPostLoginRoute(getStoredUser()?.role)} replace />;
  }

  const handleOtpChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);

    if (otpStatus !== "idle") {
      setOtpStatus("idle");
    }

    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (otpStatus !== "idle") {
        setOtpStatus("idle");
      }

      if (otpDigits[index]) {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
      } else if (index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pastedDigits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    if (pastedDigits.length === 0) return;

    if (otpStatus !== "idle") {
      setOtpStatus("idle");
    }

    const updated = Array(OTP_LENGTH).fill("");
    pastedDigits.forEach((digit, idx) => {
      updated[idx] = digit;
    });

    setOtpDigits(updated);

    const nextFocusIndex = Math.min(pastedDigits.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const otpCode = otpDigits.join("");

    if (!trimmedEmail || otpCode.length !== OTP_LENGTH) {
      setOtpStatus("error");

      toast.error("Validation error", {
        description: `Please enter your email and all ${OTP_LENGTH} digits of the OTP.`,
      });

      return;
    }

    setOtpStatus("idle");

    try {
      const response = await verifyOtp({
        email: trimmedEmail,
        otp: otpCode,
      }).unwrap();

      const resetToken = response?.data?.resetToken ?? "";

      if (!resetToken) {
        throw new Error("No reset token received. Please try again.");
      }

      setOtpStatus("success");

      toast.success("OTP verified", {
        description: "Redirecting to reset your password...",
      });

      setTimeout(() => {
        navigate(ROUTES.resetPassword || "/reset-password", {
          state: { resetToken },
        });
      }, 650);
    } catch (err: any) {
      console.error("OTP verification failed:", err);

      setOtpStatus("error");

      const errMsg =
        err?.data?.message ||
        err?.message ||
        "Invalid or expired OTP. Please try again.";

      toast.error("Verification failed", {
        description: errMsg,
      });
    }
  };

  return (
    <div className="verify-otp-page-wrapper">
      <div className="verify-otp-ambient-shape verify-otp-ambient-shape-1" />
      <div className="verify-otp-ambient-shape verify-otp-ambient-shape-2" />

      <div className="verify-otp-card-container">
        <div className="verify-otp-card-header">
          <div className="verify-otp-logo-badge">
            <LuShieldCheck size={28} />
          </div>

          <h2 className="verify-otp-brand-title">
            Verify <span>OTP</span>
          </h2>

          <p className="verify-otp-brand-subtitle">
            Enter the {OTP_LENGTH}-digit code sent to your email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="verify-otp-form-body">
          <div className="verify-otp-input-group">
            <label className="verify-otp-input-label" htmlFor="verifyOtpEmail">
              Email Address
            </label>

            <div className="verify-otp-field-box">
              <LuMail className="verify-otp-field-icon" size={18} />

              <input
                id="verifyOtpEmail"
                type="email"
                className="verify-otp-input-control"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="verify-otp-input-group">
            <div className="verify-otp-label-row">
              <label
                className="verify-otp-input-label"
                htmlFor="verifyOtpDigit0"
              >
                One-Time Code
              </label>

              {otpStatus === "error" && (
                <span className="verify-otp-status-text verify-otp-status-text--error">
                  Invalid code
                </span>
              )}

              {otpStatus === "success" && (
                <span className="verify-otp-status-text verify-otp-status-text--success">
                  Verified
                </span>
              )}
            </div>

            <div className="verify-otp-boxes-row">
              {otpDigits.map((digit, index) => {
                const statusClass =
                  otpStatus === "error"
                    ? "verify-otp-box--error"
                    : otpStatus === "success"
                      ? "verify-otp-box--success"
                      : digit
                        ? "verify-otp-box--filled"
                        : "";

                return (
                  <input
                    key={index}
                    id={`verifyOtpDigit${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    autoFocus={index === 0 && Boolean(prefillEmail)}
                    disabled={isLoading || otpStatus === "success"}
                    aria-label={`OTP digit ${index + 1}`}
                    className={`verify-otp-box ${statusClass}`}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => e.target.select()}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="verify-otp-submit-btn"
            disabled={isLoading || otpStatus === "success"}
          >
            {isLoading ? (
              <div className="verify-otp-btn-loading">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                />
                <span>Verifying...</span>
              </div>
            ) : otpStatus === "success" ? (
              "Verified ✓"
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>

        <div className="verify-otp-card-footer">
          <Link
            to={ROUTES.forgotPassword || "/forgot-password"}
            className="verify-otp-back-link"
          >
            <LuArrowLeft size={15} />
            <span>Resend OTP</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
