import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateCartSettingsMutation,
  useGetCartSettingsByIdQuery,
  useUpdateCartSettingsMutation,
} from "../../../features/cart/cartSettingsApi";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";
import "../../../styles/cart/Createcartsettings.css";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M10 12L6 8l4-4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconEdit = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="8"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="12"
      x2="12"
      y2="16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

type Role = "SuperAdmin" | "Vendor";
interface FormValues {
  handling_charge: string;
  delivery_charge: string;
  free_delivery_min_amount: string;
  small_cart_charge: string;
  small_cart_max_amount: string;
  role: Role;
}

interface FormErrors {
  handling_charge?: string;
  delivery_charge?: string;
  free_delivery_min_amount?: string;
  small_cart_charge?: string;
  small_cart_max_amount?: string;
}

// Helpers
const EMPTY_FORM: FormValues = {
  handling_charge: "",
  delivery_charge: "",
  free_delivery_min_amount: "",
  small_cart_charge: "",
  small_cart_max_amount: "",
  role: "SuperAdmin",
};

const fieldMeta: { key: keyof FormErrors; label: string; hint: string }[] = [
  { key: "handling_charge", label: "Handling Charge", hint: "per order" },
  { key: "delivery_charge", label: "Delivery Charge", hint: "base rate" },
  {
    key: "free_delivery_min_amount",
    label: "Free Delivery Minimum",
    hint: "cart total threshold",
  },
  {
    key: "small_cart_charge",
    label: "Small Cart Charge",
    hint: "fee applied to small carts",
  },
  {
    key: "small_cart_max_amount",
    label: "Small Cart Max",
    hint: "cart total limit",
  },
];

const hasErrors = (errors: FormErrors) => Object.keys(errors).length > 0;

const validateField = ( value: string): string => {
  if (value === "" || value === undefined) return `This field is required`;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0)
    return "Must be a number greater than or equal to 0";
  return "";
};

const validateAll = (values: FormValues): FormErrors => {
  const chargeFields: (keyof FormErrors)[] = [
    "handling_charge",
    "delivery_charge",
    "free_delivery_min_amount",
    "small_cart_charge",
    "small_cart_max_amount",
  ];
  const errors: FormErrors = {};
  for (const field of chargeFields) {
    const err = validateField(values[field]);
    if (err) errors[field] = err;
  }
  return errors;
};

const CreateCartSettings = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({});

  const {
    data: editData,
    isFetching: isFetchingSettings,
    isError: isFetchError,
  } = useGetCartSettingsByIdQuery(id!, { skip: !isEditMode });

  const [createCartSettings, { isLoading: isCreating }] =
    useCreateCartSettingsMutation();
  const [updateCartSettings, { isLoading: isUpdating }] =
    useUpdateCartSettingsMutation();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!isEditMode || !editData?.data) return;
    const d = editData.data;
    setValues({
      handling_charge: String(d.handling_charge ?? ""),
      delivery_charge: String(d.delivery_charge ?? ""),
      free_delivery_min_amount: String(d.free_delivery_min_amount ?? ""),
      small_cart_charge: String(d.small_cart_charge ?? ""),
      small_cart_max_amount: String(d.small_cart_max_amount ?? ""),
      role: (d.role as Role) || "SuperAdmin",
    });
  }, [editData, isEditMode]);

  // handlers
  const handleChange = (field: keyof FormErrors, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(value);
      setErrors((prev) => ({ ...prev, [field]: err || undefined }));
    } 
  };
  const handleRoleChange = (role: Role) => {
    setValues((prev) => ({ ...prev, role }));
  };
  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(values[field]);
    setErrors((prev) => ({ ...prev, [field]: err || undefined }));
  };

  const handleSubmit = async () => {
    // Touch all fields
    const allTouched = Object.fromEntries(
      fieldMeta.map((f) => [f.key, true]),
    ) as Partial<Record<keyof FormErrors, boolean>>;
    setTouched(allTouched);

    const validationErrors = validateAll(values);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      handling_charge: Number(values.handling_charge),
      delivery_charge: Number(values.delivery_charge),
      free_delivery_min_amount: Number(values.free_delivery_min_amount),
      small_cart_charge: Number(values.small_cart_charge),
      small_cart_max_amount: Number(values.small_cart_max_amount),
      role: values.role,
    };

    try {
      if (isEditMode && id) {
        await updateCartSettings({
          cartSettingsId: id,
          data: payload,
        }).unwrap();
        toast.success("Cart settings updated", {
          description: "Changes have been saved successfully.",
        });
      } else {
        await createCartSettings(payload).unwrap();
        toast.success("Cart settings created", {
          description: "New cart settings are now active.",
        });
      }
      navigate("/admin/cart-settings");
    } catch (err: any) {
      const message =
        err?.data?.message ||
        (isEditMode
          ? "Failed to update cart settings."
          : "Failed to create cart settings.");
      toast.error(message);
    }
  };

  const handleCancel = () => navigate("/admin/cart-settings");

  //Loading state (edit mode)
  if (isEditMode && isFetchingSettings) {
    return (
      <FullScreenLoader
        title="Loading Cart Settings"
        subtitle="Getting everything ready..."
      />
    );
  }

  if (isEditMode && isFetchError) {
    return (
      <div className="cs-page">
        <div
          className="cs-card"
          style={{ maxWidth: 480, padding: "40px 28px", textAlign: "center" }}
        >
          <p style={{ color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>
            Failed to load cart settings
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
            The record may have been deleted or an error occurred.
          </p>
          <button className="cs-btn-cancel" onClick={handleCancel}>
            Go back
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="cs-page">
      {/* Header section  */}
      <div className="cs-header">
        <button
          className="cs-back-btn"
          onClick={handleCancel}
          aria-label="Go back"
        >
          <IconBack />
        </button>
        <div className="cs-header-text">
          <h1>{isEditMode ? "Edit Cart Settings" : "New Cart Settings"}</h1>
          <p>
            {isEditMode
              ? "Update the charges and limits for this configuration."
              : "Configure delivery and cart charges for a role."}
          </p>
        </div>
      </div>

      {/* Card section  */}
      <div className="cs-card">
        {/* Header  */}
        <div className="cs-card-header">
          <div className="cs-card-icon">
            <IconSettings />
          </div>
          <div>
            <p className="cs-card-title">Cart Configuration</p>
            <p className="cs-card-subtitle">
              Charges apply at checkout based on cart value and role
            </p>
          </div>
          {isEditMode && (
            <span className="cs-edit-badge">
              <IconEdit />
              Editing
            </span>
          )}
        </div>

        {/* body  */}
        <div className="cs-card-body">
          <div className="cs-section">
            <p className="cs-section-label">Role Assignment</p>
            <div className="cs-info-box">
              <IconInfo />
              <p>
                Settings are scoped per role. Only one configuration can exist
                per role at a time.
              </p>
            </div>
            <div className="cs-role-group">
              {(["SuperAdmin", "Vendor"] as Role[]).map((r) => (
                <label
                  key={r}
                  className={`cs-role-option${values.role === r ? " cs-role-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="cs-role"
                    value={r}
                    checked={values.role === r}
                    onChange={() => handleRoleChange(r)}
                    disabled={isEditMode}
                  />
                  <span className="cs-role-radio-dot">
                    <span className="cs-role-radio-dot-inner" />
                  </span>
                  <span className="cs-role-text">{r}</span>
                  {values.role === r && (
                    <span className="cs-role-badge">Selected</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="cs-divider" />

          <div className="cs-section">
            <p className="cs-section-label">Charge Configuration</p>
            <div className="cs-grid-2">
              {fieldMeta.map(({ key, label, hint }) => (
                <div className="cs-field" key={key}>
                  <label className="cs-label" htmlFor={`cs-${key}`}>
                    {label}
                    <span className="cs-label-hint">({hint})</span>
                  </label>
                  <div className="cs-input-wrap">
                    <span className="cs-input-prefix">₹</span>
                    <input
                      id={`cs-${key}`}
                      type="number"
                      min="0"
                      step="0.01"
                      className={`cs-input${errors[key] && touched[key] ? " cs-input-error" : ""}`}
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      onBlur={() => handleBlur(key)}
                      placeholder="0.00"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors[key] && touched[key] && (
                    <span className="cs-error-msg">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      {errors[key]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer  */}
        <div className="cs-footer">
          <button
            className="cs-btn-cancel"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="cs-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="cs-spinner" />}
            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCartSettings;
