import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useFetchVendorByIdQuery,
} from "../../../features/vendor/vendorApi";
import "../../../styles/vendor/AddVendor.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";
import type {
  CreateVendorPayload,
  UpdateVendorPayload,
} from "../../../features/vendor/vendorTypes";

interface VendorFormState {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

const initialState: VendorFormState = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const Spinner: React.FC = () => <span className="av-spinner" aria-hidden />;

const AddVendor: React.FC = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams<{ vendorId?: string }>();
  const isEditMode = Boolean(vendorId);

  const [form, setForm] = useState<VendorFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  const {
    data: vendorRes,
    isLoading: vendorLoading,
    isError: vendorError,
  } = useFetchVendorByIdQuery(vendorId!, { skip: !isEditMode });

  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!vendorRes?.data) return;
    const v = vendorRes.data;
    setForm({
      fullName: v.fullName ?? "",
      email: v.email ?? "",
      password: "",
      phone: v.phone ?? "",
      address: v.address ?? "",
    });
    setTouched({ fullName: true, email: true, phone: true, address: true });
  }, [vendorRes]);

  const trimmed = {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
  };

  const errors = {
    fullName: !touched.fullName
      ? ""
      : !trimmed.fullName
        ? "Full name is required."
        : trimmed.fullName.length < 3
          ? "Name must be at least 3 characters."
          : "",
    email: !touched.email
      ? ""
      : !trimmed.email
        ? "Email is required."
        : !EMAIL_RE.test(trimmed.email)
          ? "Enter a valid email address."
          : "",
    password: !touched.password
      ? ""
      : isEditMode && !form.password
        ? ""
        : !form.password
          ? "Password is required."
          : form.password.length < 8
            ? "Password must be at least 8 characters."
            : "",
    phone: !touched.phone
      ? ""
      : !trimmed.phone
        ? "Phone number is required."
        : !PHONE_RE.test(trimmed.phone)
          ? "Enter a valid 10-digit Indian mobile number."
          : "",
    address: !touched.address
      ? ""
      : !trimmed.address
        ? "Address is required."
        : trimmed.address.length < 10
          ? "Add a more complete address (min 10 characters)."
          : "",
  };

  const isFormValid =
    trimmed.fullName.length >= 3 &&
    EMAIL_RE.test(trimmed.email) &&
    (isEditMode
      ? !form.password || form.password.length >= 8
      : form.password.length >= 8) &&
    PHONE_RE.test(trimmed.phone) &&
    trimmed.address.length >= 10;

  const markAllTouched = () =>
    setTouched({
      fullName: true,
      email: true,
      password: true,
      phone: true,
      address: true,
    });

  const handleReset = () => {
    setForm(initialState);
    setTouched({});
    navigate("/admin/vendors");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllTouched();
    if (!isFormValid) return;

    try {
      if (isEditMode) {
        const payload: UpdateVendorPayload = {
          fullName: trimmed.fullName,
          email: trimmed.email,
          phone: trimmed.phone,
          address: trimmed.address,
          ...(form.password && { password: form.password }),
        };
        await updateVendor({ userId: vendorId!, payload }).unwrap();
        toast.success("Vendor updated", {
          description: `"${trimmed.fullName}" has been updated successfully.`,
        });
      } else {
        const payload: CreateVendorPayload = {
          fullName: trimmed.fullName,
          email: trimmed.email,
          password: form.password,
          phone: trimmed.phone,
          address: trimmed.address,
        };
        await createVendor(payload).unwrap();
        toast.success("Vendor created", {
          description: `"${trimmed.fullName}" has been added successfully.`,
        });
      }
      navigate("/admin/vendors");
    } catch (err: any) {
      toast.error(
        isEditMode ? "Failed to update vendor" : "Failed to create vendor",
        {
          description:
            err?.data?.message || "Something went wrong. Please try again.",
        },
      );
    }
  };

  if (isEditMode && vendorLoading)
    return (
      <FullScreenLoader
        title="Loading Vendor"
        subtitle="Fetching vendor details..."
      />
    );

  if (isEditMode && vendorError)
    return (
      <div className="av-page">
        <div className="av-ambient-glow" />
        <div className="container-fluid av-container">
          <div className="av-card av-error-state">
            <p>Failed to load vendor details. Please try again.</p>
            <button
              className="btn av-btn-ghost"
              onClick={() => navigate("/admin/vendors")}
            >
              Back to vendors
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="av-page">
      <div className="av-ambient-orb orb-1" />
      <div className="av-ambient-orb orb-2" />
      <div className="av-ambient-orb orb-3" />

      <div className="container-fluid av-container">
        <header className="av-header">
          <div>
            <h1 className="av-title">
              {isEditMode ? "Edit Vendor" : "Add Vendor"}
            </h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} onReset={handleReset} noValidate>
          <fieldset disabled={isSubmitting}>
            <div className="av-card">
              <div className="av-card-shimmer" />
              <header className="av-card-header">
                <span className="av-card-index">01</span>
                <div>
                  <h2>Vendor Details</h2>
                  <p>Contact information & system access credentials</p>
                </div>
              </header>

              <div className="row g-4">
                {/* Full name */}
                <div className="col-12 col-md-6">
                  <div className="av-field">
                    <label htmlFor="av-fullName">Full Name</label>
                    <input
                      id="av-fullName"
                      type="text"
                      className={`form-control av-input ${errors.fullName ? "is-invalid" : ""}`}
                      placeholder="e.g. Steve Harrington"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, fullName: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, fullName: true }))
                      }
                    />
                    {errors.fullName && (
                      <div className="av-error">{errors.fullName}</div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="col-12 col-md-6">
                  <div className="av-field">
                    <label htmlFor="av-phone">Phone Number</label>
                    <input
                      id="av-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className={`form-control av-input ${errors.phone ? "is-invalid" : ""}`}
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          phone: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    />
                    {errors.phone && (
                      <div className="av-error">{errors.phone}</div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="col-12 col-md-6">
                  <div className="av-field">
                    <label htmlFor="av-email">Work Email</label>
                    <input
                      id="av-email"
                      type="email"
                      className={`form-control av-input ${errors.email ? "is-invalid" : ""}`}
                      placeholder="vendor@company.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    />
                    {errors.email && (
                      <div className="av-error">{errors.email}</div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="col-12 col-md-6">
                  <div className="av-field">
                    <label htmlFor="av-password">
                      {isEditMode ? "New Password" : "Login Password"}
                      {isEditMode && (
                        <span className="av-hint-inline">
                          {" "}(optional)
                        </span>
                      )}
                    </label>
                    <div className="av-password-wrap">
                      <input
                        ref={passwordRef}
                        id="av-password"
                        type={showPassword ? "text" : "password"}
                        className={`form-control av-input ${errors.password ? "is-invalid" : ""}`}
                        placeholder={
                          isEditMode
                            ? "Leave blank to keep unchanged"
                            : "At least 8 characters"
                        }
                        value={form.password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, password: e.target.value }))
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, password: true }))
                        }
                      />
                      <button
                        type="button"
                        className="av-password-toggle"
                        onClick={() => setShowPassword((s) => !s)}
                        tabIndex={-1}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="av-error">{errors.password}</div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="col-12">
                  <div className="av-field">
                    <label htmlFor="av-address">Business Address</label>
                    <textarea
                      id="av-address"
                      className={`form-control av-input av-textarea ${errors.address ? "is-invalid" : ""}`}
                      placeholder="Street, Suite / Floor, City, State, PIN"
                      rows={3}
                      value={form.address}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, address: true }))
                      }
                    />
                    {errors.address && (
                      <div className="av-error">{errors.address}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="av-actions">
              <button type="reset" className="btn av-btn-ghost">
                Discard
              </button>
              <button
                type="submit"
                className="btn av-btn-primary"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting && <Spinner />}
                {isSubmitting
                  ? isEditMode
                    ? "Saving changes…"
                    : "Registering…"
                  : isEditMode
                    ? "Save Changes"
                    : "Create Vendor"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default AddVendor;