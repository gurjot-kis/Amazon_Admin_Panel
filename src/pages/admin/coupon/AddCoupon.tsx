import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateAdminCouponMutation,
  useGetAdminCouponByIdQuery,
  useUpdateAdminCouponMutation,
} from "../../../features/coupon/couponAPI";
import type { CreateCouponPayload } from "../../../features/coupon/couponTypes";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/coupon/AddCoupon.css";
import { useFetchStoresByVendorIdQuery } from "../../../features/store/storeApi";
import { useFetchActiveVendorsListQuery } from "../../../features/vendor/vendorApi";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";
import { DatePickerInput } from "../../../components/common/DatePickerInput";
import { UploadCouponImageModal } from "../../../components/UploadCouponImageModal";

const toInputDate = (iso: string) => (iso ? iso.slice(0, 10) : "");

const INITIAL_FORM: CreateCouponPayload = {
  code: "",
  title: "",
  description: "",
  discount_type: "percentage",
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: null,
  usage_limit: 0,
  per_user_limit: 0,
  scope: "global",
  store_ids: [],
  start_date: "",
  end_date: "",
};

const AddCoupon = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [form, setForm] = useState<CreateCouponPayload>(INITIAL_FORM);
  const [isLifetime, setIsLifetime] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCouponPayload, string>>
  >({});

  // Vendor dropdown state
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const { data: vendorsData, isLoading: isLoadingVendors } =
    useFetchActiveVendorsListQuery();
  const activeVendors = vendorsData?.data ?? [];
  const filteredVendors = activeVendors.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()),
  );
  const selectedVendor = activeVendors.find((v) => v._id === selectedVendorId);

  const { data: vendorStoresData } = useFetchStoresByVendorIdQuery(
    selectedVendorId,
    { skip: !selectedVendorId || form.scope !== "store" },
  );
  const vendorStores = vendorStoresData?.data ?? [];

  const { data: couponData, isLoading: isLoadingCoupon } =
    useGetAdminCouponByIdQuery(id!, { skip: !isEdit });

  const [createCoupon, { isLoading: isCreating }] =
    useCreateAdminCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] =
    useUpdateAdminCouponMutation();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        vendorDropdownRef.current &&
        !vendorDropdownRef.current.contains(e.target as Node)
      ) {
        setVendorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setHeaderConfig({ title: isEdit ? "Edit Coupon" : "Add Coupon" });
  }, [setHeaderConfig, isEdit]);

  useEffect(() => {
    if (!couponData?.data) return;
    const c = couponData.data;
    const lifetime = !c.end_date;
    setIsLifetime(lifetime);

    if (c.vendor_id) {
      const vid =
        typeof c.vendor_id === "string"
          ? c.vendor_id
          : (c.vendor_id as any)._id;
      setSelectedVendorId(vid);
    }
    setForm({
      code: c.code ?? "",
      title: c.title ?? "",
      description: c.description ?? "",
      discount_type: c.discount_type ?? "percentage",
      discount_value: c.discount_value ?? 0,
      min_order_amount: c.min_order_amount ?? 0,
      max_discount_amount: c.max_discount_amount ?? null,
      usage_limit: c.usage_limit ?? 0,
      per_user_limit: c.per_user_limit ?? 0,
      scope: c.scope ?? "global",
      store_ids: c.store_ids ?? [],
      start_date: toInputDate(c.start_date),
      end_date: lifetime ? "" : toInputDate(c.end_date),
    });
  }, [couponData]);

  const set = <K extends keyof CreateCouponPayload>(
    key: K,
    value: CreateCouponPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleStore = (storeId: string) => {
    setForm((prev) => {
      const already = prev.store_ids?.includes(storeId);
      if (already && prev.store_ids?.length === 1) return prev;
      return {
        ...prev,
        store_ids: already
          ? prev.store_ids!.filter((sid) => sid !== storeId)
          : [...(prev.store_ids ?? []), storeId],
      };
    });
  };

  const generateRandomCode = () => {
    const prefixes = ["SALE", "DEAL", "SPECIAL", "SUPER", "VIP"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    set("code", `${prefix}${num}`);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CreateCouponPayload, string>> = {};
    if (!form.code.trim()) e.code = "Coupon code is required";
    if (!form.title.trim()) e.title = "Promotion title is required";
    if (!form.discount_value || form.discount_value <= 0)
      e.discount_value = "Must be greater than 0";
    if (form.discount_type === "percentage" && form.discount_value > 100)
      e.discount_value = "Percentage cannot exceed 100%";
    if (!form.start_date) e.start_date = "Select start date";
    if (!isLifetime && !form.end_date) e.end_date = "Select end date";
    if (
      !isLifetime &&
      form.start_date &&
      form.end_date &&
      form.end_date <= form.start_date
    )
      e.end_date = "Must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleScopeChange = (scope: "global" | "store") => {
    setForm((prev) => ({ ...prev, scope, store_ids: [] }));
    setSelectedVendorId("");
  };

  const handleVendorSelect = (vendorId: string) => {
    if (vendorId !== selectedVendorId) {
      setForm((prev) => ({ ...prev, store_ids: [] }));
    }
    setSelectedVendorId(vendorId);
    setVendorDropdownOpen(false);
    setVendorSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: CreateCouponPayload = {
      ...form,
      end_date: isLifetime ? "" : form.end_date,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_discount_amount: form.max_discount_amount
        ? Number(form.max_discount_amount)
        : null,
      usage_limit: Number(form.usage_limit) || 0,
      per_user_limit: Number(form.per_user_limit) || 0,
      // if global, clear store_ids; if store, include vendor_id too
      store_ids: form.scope === "global" ? [] : form.store_ids,
      ...(form.scope === "store" && selectedVendorId
        ? { vendor_id: selectedVendorId }
        : {}),
    };
    try {
      if (isEdit) {
        await updateCoupon({ couponId: id!, payload }).unwrap();
        toast.success("Coupon updated", {
          description: `"${form.code}" updated successfully.`,
        });
      } else {
        await createCoupon(payload).unwrap();
        toast.success("Coupon created", {
          description: `"${form.code}" is ready to use.`,
        });
      }
      navigate("/admin/coupons");
    } catch (err: any) {
      toast.error(isEdit ? "Update failed" : "Create failed", {
        description: err?.data?.message || "Something went wrong.",
      });
    }
  };

  if (isEdit && isLoadingCoupon) {
    return (
      <FullScreenLoader
        title="Loading Coupon"
        subtitle="Retrieving coupon details..."
      />
    );
  }

  return (
    <>
      <form className="ac-dashboard-wrapper" onSubmit={handleSubmit} noValidate>
        <div className="ac-header-strip">
          <div>
            <h1 className="ac-heading">
              {isEdit ? "Edit Campaign Coupon" : "Create New Campaign"}
            </h1>
            <p className="ac-subheading">
              Design promotional discounts, enforce checkout criteria, and track
              usage limits.
            </p>
          </div>
          <div className="ac-top-actions">
            <button
              type="button"
              className="ac-btn-subtle"
              onClick={() => {
                if (!id) {
                  toast.info(
                    "Please create and save the coupon first before uploading banners.",
                  );
                  return;
                }
                setIsUploadModalOpen(true);
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 6 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Coupon Banner
            </button>
            <button
              type="button"
              className="ac-btn-subtle"
              onClick={() => navigate("/admin/coupons")}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="ac-btn-accent" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="ac-spinner-sm" />
                  <span>Processing...</span>
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Launch Campaign"
              )}
            </button>
          </div>
        </div>

        <div className="ac-grid">
          {/* ── MAIN COLUMN ── */}
          <div className="ac-column-main">
            {/* Basic Info */}
            <div className="ac-panel">
              <div className="ac-panel-header">
                <div className="ac-badge-icon ac-badge-icon--indigo">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
                <div className="ac-panel-title-group">
                  <h3>Campaign Identification</h3>
                  <span>Basic naming and public identifiers</span>
                </div>
              </div>
              <div className="ac-panel-body">
                <div className="ac-form-row">
                  <div className="ac-form-group ac-fg-code">
                    <div className="ac-label-split">
                      <label className="ac-label">
                        Coupon Code <span className="ac-asterisk">*</span>
                      </label>
                      <button
                        type="button"
                        className="ac-magic-btn"
                        onClick={generateRandomCode}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Quick Code
                      </button>
                    </div>
                    <input
                      type="text"
                      className={`ac-text-input ac-input-code ${errors.code ? "ac-input--invalid" : ""}`}
                      placeholder="e.g. FLASH30"
                      value={form.code}
                      onChange={(e) =>
                        set("code", e.target.value.toUpperCase())
                      }
                      maxLength={20}
                    />
                    {errors.code && (
                      <span className="ac-field-error">{errors.code}</span>
                    )}
                  </div>
                  <div className="ac-form-group ac-fg-flex">
                    <label className="ac-label">
                      Promotion Headline <span className="ac-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className={`ac-text-input ${errors.title ? "ac-input--invalid" : ""}`}
                      placeholder="e.g. Festive Bonanza — 25% Off Storewide"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                    {errors.title && (
                      <span className="ac-field-error">{errors.title}</span>
                    )}
                  </div>
                </div>
                <div className="ac-form-group">
                  <div className="ac-label-split">
                    <label className="ac-label">Customer Description</label>
                    <span className="ac-helper-tag">Displays at checkout</span>
                  </div>
                  <textarea
                    className="ac-textarea-input"
                    rows={3}
                    placeholder="Tell customers how they can enjoy this discount..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Discount */}
            <div className="ac-panel">
              <div className="ac-panel-header">
                <div className="ac-badge-icon ac-badge-icon--emerald">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ac-panel-title-group">
                  <h3>Discount Mechanics</h3>
                  <span>Configure value, calculation mode, and caps</span>
                </div>
              </div>
              <div className="ac-panel-body">
                <div className="ac-form-row">
                  <div className="ac-form-group" style={{ flex: "0 0 240px" }}>
                    <label className="ac-label">Discount Method</label>
                    <div className="ac-pill-switcher">
                      <button
                        type="button"
                        className={`ac-pill-tab ${form.discount_type === "percentage" ? "is-active" : ""}`}
                        onClick={() => set("discount_type", "percentage")}
                      >
                        % Percentage
                      </button>
                      <button
                        type="button"
                        className={`ac-pill-tab ${form.discount_type === "fixed" ? "is-active" : ""}`}
                        onClick={() => set("discount_type", "fixed")}
                      >
                        ₹ Fixed Cut
                      </button>
                    </div>
                  </div>
                  <div className="ac-form-group" style={{ flex: "1 1 180px" }}>
                    <label className="ac-label">
                      Discount Amount <span className="ac-asterisk">*</span>
                    </label>
                    <div className="ac-input-addon-group">
                      <span className="ac-addon">
                        {form.discount_type === "percentage" ? "%" : "₹"}
                      </span>
                      <input
                        type="number"
                        className={`ac-text-input ac-addon-input ${errors.discount_value ? "ac-input--invalid" : ""}`}
                        placeholder="0"
                        min={0}
                        max={
                          form.discount_type === "percentage" ? 100 : undefined
                        }
                        value={form.discount_value || ""}
                        onChange={(e) =>
                          set("discount_value", Number(e.target.value))
                        }
                      />
                    </div>
                    {errors.discount_value && (
                      <span className="ac-field-error">
                        {errors.discount_value}
                      </span>
                    )}
                  </div>
                  <div className="ac-form-group" style={{ flex: "1 1 180px" }}>
                    <label className="ac-label">Min. Order Value</label>
                    <div className="ac-input-addon-group">
                      <span className="ac-addon">₹</span>
                      <input
                        type="number"
                        className="ac-text-input ac-addon-input"
                        placeholder="0"
                        min={0}
                        value={form.min_order_amount || ""}
                        onChange={(e) =>
                          set("min_order_amount", Number(e.target.value))
                        }
                      />
                    </div>
                    <span className="ac-hint-text">
                      Leave 0 for no threshold
                    </span>
                  </div>
                  {form.discount_type === "percentage" && (
                    <div
                      className="ac-form-group"
                      style={{ flex: "1 1 180px" }}
                    >
                      <label className="ac-label">Max. Discount Cap</label>
                      <div className="ac-input-addon-group">
                        <span className="ac-addon">₹</span>
                        <input
                          type="number"
                          className="ac-text-input ac-addon-input"
                          placeholder="Unlimited"
                          min={0}
                          value={form.max_discount_amount ?? ""}
                          onChange={(e) =>
                            set(
                              "max_discount_amount",
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                        />
                      </div>
                      <span className="ac-hint-text">
                        Leave blank for no limit
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Validity */}
            <div className="ac-panel">
              <div className="ac-panel-header">
                <div className="ac-badge-icon ac-badge-icon--amber">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ac-panel-title-group">
                  <h3>Validity Period</h3>
                  <span>Campaign start timeline and expiration criteria</span>
                </div>
              </div>
              <div className="ac-panel-body">
                <div className="ac-form-row">
                  <div className="ac-form-group" style={{ flex: 1 }}>
                    <label className="ac-label">
                      Valid From <span className="ac-asterisk">*</span>
                    </label>
                    <DatePickerInput
                      value={form.start_date}
                      onChange={(val) => set("start_date", val)}
                      placeholder="Select start date"
                      hasError={!!errors.start_date}
                    />
                    {errors.start_date && (
                      <span className="ac-field-error">
                        {errors.start_date}
                      </span>
                    )}
                  </div>
                  <div className="ac-form-group" style={{ flex: 1 }}>
                    <label className="ac-label">
                      Valid Till{" "}
                      {!isLifetime && <span className="ac-asterisk">*</span>}
                    </label>
                    <DatePickerInput
                      value={form.end_date}
                      onChange={(val) => set("end_date", val)}
                      placeholder="Select end date"
                      hasError={!!errors.end_date}
                      disabled={isLifetime}
                      minDate={form.start_date}
                    />
                    {errors.end_date && (
                      <span className="ac-field-error">{errors.end_date}</span>
                    )}
                  </div>
                  {/* <div className="ac-form-group ac-form-group--center">
                  <label className="ac-label">&nbsp;</label>
                  <label className="ac-lifetime-check">
                    <input
                      type="checkbox"
                      checked={isLifetime}
                      onChange={(e) => {
                        setIsLifetime(e.target.checked);
                        if (e.target.checked) set("end_date", "");
                      }}
                    />
                    <span className="ac-lifetime-box">
                      {isLifetime && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="white"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="ac-lifetime-label">No Expiry</span>
                  </label>
                </div> */}
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="ac-panel">
              <div className="ac-panel-header">
                <div className="ac-badge-icon ac-badge-icon--violet">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ac-panel-title-group">
                  <h3>Redemption Limits</h3>
                  <span>Control volume and prevent promotional abuse</span>
                </div>
              </div>
              <div className="ac-panel-body">
                <div className="ac-form-row">
                  <div className="ac-form-group" style={{ flex: 1 }}>
                    <label className="ac-label">Global Usage Limit</label>
                    <input
                      type="number"
                      className="ac-text-input"
                      placeholder="Unlimited"
                      min={0}
                      value={form.usage_limit || ""}
                      onChange={(e) =>
                        set("usage_limit", Number(e.target.value))
                      }
                    />
                    <span className="ac-hint-text">
                      Total coupon activations allowed
                    </span>
                  </div>
                  <div className="ac-form-group" style={{ flex: 1 }}>
                    <label className="ac-label">Usage Limit Per Customer</label>
                    <input
                      type="number"
                      className="ac-text-input"
                      placeholder="Unlimited"
                      min={0}
                      value={form.per_user_limit || ""}
                      onChange={(e) =>
                        set("per_user_limit", Number(e.target.value))
                      }
                    />
                    <span className="ac-hint-text">
                      Max claims per registered user
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="ac-column-side">
            {/* Scope */}
            <div className="ac-panel">
              <div className="ac-panel-header">
                <div className="ac-badge-icon ac-badge-icon--sky">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ac-panel-title-group">
                  <h3>Coupon Scope</h3>
                  <span>Where this promotion can be applied</span>
                </div>
              </div>
              <div className="ac-panel-body">
                <div className="ac-scope-options">
                  <label
                    className={`ac-scope-card ${form.scope === "global" ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="global"
                      checked={form.scope === "global"}
                      onChange={() => handleScopeChange("global")}
                    />
                    <div className="ac-scope-icon-wrap">🌐</div>
                    <div className="ac-scope-details">
                      <span className="ac-scope-title">All Stores</span>
                      <span className="ac-scope-desc">
                        Applies across every store on the platform
                      </span>
                    </div>
                    <div className="ac-check-indicator" />
                  </label>
                  <label
                    className={`ac-scope-card ${form.scope === "store" ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="store"
                      checked={form.scope === "store"}
                      onChange={() => handleScopeChange("store")}
                    />
                    <div className="ac-scope-icon-wrap">🏪</div>
                    <div className="ac-scope-details">
                      <span className="ac-scope-title">Specific Store</span>
                      <span className="ac-scope-desc">
                        Restricted to a selected vendor's store
                      </span>
                    </div>
                    <div className="ac-check-indicator" />
                  </label>
                </div>
              </div>
            </div>

            {/* Vendor + Store selector — only when scope = store */}
            {form.scope === "store" && (
              <div className="ac-panel">
                <div className="ac-panel-header">
                  <div className="ac-badge-icon ac-badge-icon--emerald">
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ac-panel-title-group">
                    <h3>Vendor & Stores</h3>
                    <span>
                      {selectedVendorId
                        ? `${form.store_ids?.length ?? 0} store(s) selected`
                        : "Select a vendor first"}
                    </span>
                  </div>
                </div>
                <div className="ac-panel-body">
                  {/* ── Custom Vendor Dropdown ── */}
                  <div className="ac-form-group">
                    <label className="ac-label">Select Vendor</label>
                    <div className="ac-vd-wrap" ref={vendorDropdownRef}>
                      <button
                        type="button"
                        className={`ac-vd-trigger ${vendorDropdownOpen ? "is-open" : ""}`}
                        onClick={() => setVendorDropdownOpen((v) => !v)}
                      >
                        <span className="ac-vd-trigger-text">
                          {selectedVendor
                            ? selectedVendor.name
                            : selectedVendorId
                              ? isLoadingVendors
                                ? "Loading vendor..."
                                : "Vendor unavailable"
                              : "Choose a vendor..."}
                        </span>
                        <svg
                          className={`ac-vd-chevron ${vendorDropdownOpen ? "is-flipped" : ""}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {vendorDropdownOpen && (
                        <div className="ac-vd-dropdown">
                          {/* Search inside dropdown */}
                          <div className="ac-vd-search-wrap">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="ac-vd-search-icon"
                            >
                              <circle
                                cx="11"
                                cy="11"
                                r="7"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M21 21l-4.3-4.3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            <input
                              type="text"
                              className="ac-vd-search"
                              placeholder="Search vendors..."
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              autoFocus
                            />
                          </div>

                          <div className="ac-vd-list">
                            {filteredVendors.length === 0 ? (
                              <div className="ac-vd-empty">
                                No vendors found
                              </div>
                            ) : (
                              filteredVendors.map((vendor) => (
                                <button
                                  key={vendor._id}
                                  type="button"
                                  className={`ac-vd-option ${selectedVendorId === vendor._id ? "is-selected" : ""}`}
                                  onClick={() => handleVendorSelect(vendor._id)}
                                >
                                  <span className="ac-vd-avatar">
                                    {vendor.name.slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="ac-vd-name">
                                    {vendor.name}
                                  </span>
                                  {selectedVendorId === vendor._id && (
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M5 13l4 4L19 7"
                                        stroke="#6366f1"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Store cards (appear after vendor selected) ── */}
                  {selectedVendorId && (
                    <div className="ac-store-grid">
                      {vendorStores.length === 0 ? (
                        <div className="ac-vd-empty">
                          No active stores for this vendor
                        </div>
                      ) : (
                        vendorStores.map((store) => {
                          const isSelected = form.store_ids?.includes(
                            store._id,
                          );
                          const logoUrl = store.store_logo
                            ? `${import.meta.env.VITE_API_ASSET_URL}${store.store_logo}`
                            : null;
                          return (
                            <button
                              key={store._id}
                              type="button"
                              className={`ac-store-card ${isSelected ? "ac-store-card--on" : ""}`}
                              onClick={() => toggleStore(store._id)}
                            >
                              <div className="ac-store-logo">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt={store.store_name}
                                    onError={(e) => {
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span>
                                    {store.store_name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="ac-store-name">
                                {store.store_name}
                              </span>
                              <span
                                className={`ac-store-check ${isSelected ? "ac-store-check--on" : ""}`}
                              >
                                {isSelected && (
                                  <svg
                                    width="9"
                                    height="9"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M5 13l4 4L19 7"
                                      stroke="white"
                                      strokeWidth="3.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Voucher Preview */}
            <div className="ac-voucher-preview">
              <div className="ac-voucher-header">
                <span>LIVE PREVIEW</span>
                <span className="ac-voucher-status">Active Preview</span>
              </div>
              <div className="ac-ticket">
                <div className="ac-ticket-cutout ac-ticket-cutout--left" />
                <div className="ac-ticket-cutout ac-ticket-cutout--right" />
                <div className="ac-ticket-top">
                  <div className="ac-ticket-brand">
                    <span className="ac-ticket-dot" />
                    <span>SPECIAL PROMOTION</span>
                  </div>
                  <div className="ac-ticket-amount">
                    {form.discount_value ? (
                      form.discount_type === "percentage" ? (
                        <>
                          {form.discount_value}
                          <span>% OFF</span>
                        </>
                      ) : (
                        <>
                          ₹{form.discount_value}
                          <span>OFF</span>
                        </>
                      )
                    ) : (
                      <>
                        00<span>% OFF</span>
                      </>
                    )}
                  </div>
                  <div className="ac-ticket-title">
                    {form.title || "Your Campaign Title"}
                  </div>
                </div>
                <div className="ac-ticket-divider" />
                <div className="ac-ticket-bottom">
                  <div className="ac-ticket-code-box">
                    <span className="ac-ticket-code-label">CODE:</span>
                    <span className="ac-ticket-code-val">
                      {form.code || "SAMPLECODE"}
                    </span>
                  </div>
                  <div className="ac-ticket-meta">
                    <div className="ac-ticket-row">
                      <span>Scope:</span>
                      <strong>
                        {form.scope === "global"
                          ? "🌐 All Stores"
                          : "🏪 Store Specific"}
                      </strong>
                    </div>
                    <div className="ac-ticket-row">
                      <span>Valid Through:</span>
                      <strong>
                        {isLifetime
                          ? "Lifetime"
                          : form.end_date
                            ? form.end_date
                            : "—"}
                      </strong>
                    </div>
                    <div className="ac-ticket-row">
                      <span>Min. Purchase:</span>
                      <strong>
                        {form.min_order_amount
                          ? `₹${form.min_order_amount}`
                          : "None"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <UploadCouponImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        couponId={id ?? ""}
        role="admin"
        initialWebsiteImage={
          couponData?.data?.website_image ||
          couponData?.data?.coupon_image_website
        }
        initialMobileImage={
          couponData?.data?.mobile_image ||
          couponData?.data?.coupon_image_mobile
        }
      />
    </>
  );
};

export default AddCoupon;
