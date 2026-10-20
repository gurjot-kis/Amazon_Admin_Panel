import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateStoreMutation,
  useGetMyStoreByIdQuery,
  useUpdateMyStoreMutation,
} from "../../../features/store/storeApi";
import type {
  CreateStorePayload,
  UpdateStorePayload,
} from "../../../features/store/storeTypes";
// Reuses the shared cc-* form styles from the category page.
import "../../../styles/category/AddCategory.css";
// Extra styles only needed by the store form.
import "../../../styles/store/AddStore.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const STORE_LIST_PATH = "/vendor/stores"; // change to your vendor store list route
const MAX_LOGO_MB = 2;
const MAX_BANNER_MB = 4;
const MAX_DESC_LENGTH = 500;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s-]{7,16}$/;
const POSTAL_REGEX = /^[A-Za-z0-9\s-]{3,10}$/;
const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

interface StoreFormState {
  store_name: string;
  store_description: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  gst_number: string;
  latitude: string;
  longitude: string;
  is_default: boolean;
}

type TextField = Exclude<keyof StoreFormState, "is_default">;
type FormErrors = Partial<Record<TextField, string>>;

const initialState: StoreFormState = {
  store_name: "",
  store_description: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  state: "",
  city: "",
  postal_code: "",
  gst_number: "",
  latitude: "",
  longitude: "",
  is_default: false,
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const assetUrl = (path: string): string =>
  /^https?:\/\//i.test(path)
    ? path
    : `${import.meta.env.VITE_API_ASSET_URL}${path}`;

const getErrorMessage = (err: unknown): string => {
  const e = err as {
    data?: { message?: string; errors?: Array<{ message?: string } | string> };
    error?: string;
    message?: string;
  };

  const first = e?.data?.errors?.[0];
  if (first) {
    return typeof first === "string" ? first : (first.message ?? "");
  }
  return (
    e?.data?.message ||
    e?.error ||
    e?.message ||
    "Something went wrong. Please try again."
  );
};

/** Builds multipart FormData for create, skipping empty values. */
const toFormData = (payload: CreateStorePayload): FormData => {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (value instanceof File) fd.append(key, value);
    else fd.append(key, String(value));
  });
  return fd;
};

const validate = (f: StoreFormState): FormErrors => {
  const errors: FormErrors = {};
  const name = f.store_name.trim();
  const address = f.address.trim();

  if (!name) errors.store_name = "Store name is required.";
  else if (name.length < 2)
    errors.store_name = "Store name is too short (min 2 characters).";

  if (f.store_description.length > MAX_DESC_LENGTH)
    errors.store_description = `Description can't exceed ${MAX_DESC_LENGTH} characters.`;

  if (f.email.trim() && !EMAIL_REGEX.test(f.email.trim()))
    errors.email = "Enter a valid email address.";

  if (f.phone.trim() && !PHONE_REGEX.test(f.phone.trim()))
    errors.phone = "Enter a valid phone number (7–15 digits).";

  if (!address) errors.address = "Address is required.";
  else if (address.length < 5)
    errors.address = "Add a little more detail (min 5 characters).";

  if (f.postal_code.trim() && !POSTAL_REGEX.test(f.postal_code.trim()))
    errors.postal_code = "Enter a valid postal code.";

  if (f.gst_number.trim() && !GST_REGEX.test(f.gst_number.trim().toUpperCase()))
    errors.gst_number = "Enter a valid 15-character GSTIN.";

  const hasLat = f.latitude.trim() !== "";
  const hasLng = f.longitude.trim() !== "";
  if (hasLat || hasLng) {
    const lat = Number(f.latitude);
    const lng = Number(f.longitude);
    if (!hasLat)
      errors.latitude = "Latitude is required when longitude is set.";
    else if (Number.isNaN(lat) || lat < -90 || lat > 90)
      errors.latitude = "Latitude must be between -90 and 90.";

    if (!hasLng)
      errors.longitude = "Longitude is required when latitude is set.";
    else if (Number.isNaN(lng) || lng < -180 || lng > 180)
      errors.longitude = "Longitude must be between -180 and 180.";
  }

  return errors;
};

/* -------------------------------------------------------------------------- */
/*                         Image field state (logo/banner)                    */
/* -------------------------------------------------------------------------- */

const useImageField = (maxMb: number) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  useEffect(() => () => revoke(), [revoke]);

  const select = useCallback(
    (f: File | null | undefined) => {
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        setError("Only image files are supported (PNG, JPG, WEBP).");
        return;
      }
      if (f.size > maxMb * 1024 * 1024) {
        setError(`Image must be smaller than ${maxMb}MB.`);
        return;
      }
      revoke();
      const url = URL.createObjectURL(f);
      blobRef.current = url;
      setError(null);
      setRemoved(false);
      setFile(f);
      setPreview(url);
    },
    [maxMb, revoke],
  );

  const remove = useCallback(() => {
    revoke();
    setFile(null);
    setPreview(null);
    setError(null);
    setRemoved(true);
  }, [revoke]);

  /** Used to show the image that is already saved on the server. */
  const setExisting = useCallback(
    (url: string | null) => {
      revoke();
      setFile(null);
      setPreview(url);
      setRemoved(false);
      setError(null);
    },
    [revoke],
  );

  return { file, preview, removed, error, select, remove, setExisting };
};

/* -------------------------------------------------------------------------- */
/*                               Small components                             */
/* -------------------------------------------------------------------------- */

const Spinner: React.FC = () => <span className="cc-spinner" aria-hidden />;

interface ImageUploadProps {
  variant: "logo" | "banner";
  preview: string | null;
  error: string | null;
  hint: string;
  onSelect: (file: File | null | undefined) => void;
  onRemove: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  variant,
  preview,
  error,
  hint,
  onSelect,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <>
      <div
        className={`cc-dropzone st-dropzone st-dropzone--${variant} ${
          isDragging ? "is-dragging" : ""
        } ${error ? "is-invalid" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          onSelect(e.dataTransfer.files?.[0]);
        }}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <div className="cc-preview-wrap">
            <img
              src={preview}
              alt={`Store ${variant} preview`}
              className="cc-dropzone-image"
            />
            <button
              type="button"
              className="cc-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (inputRef.current) inputRef.current.value = "";
                onRemove();
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="cc-dropzone-empty">
            <div className="cc-dropzone-icon">⤒</div>
            <p className="cc-dropzone-title">
              Drag &amp; drop, or click to browse
            </p>
            <p className="cc-dropzone-hint">{hint}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            onSelect(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <div className="cc-error">{error}</div>}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const AddStore: React.FC = () => {
  const { storeId } = useParams<{ storeId?: string }>();
  const isEditMode = Boolean(storeId);
  const navigate = useNavigate();

  const [form, setForm] = useState<StoreFormState>(initialState);
  const [touched, setTouched] = useState<Partial<Record<TextField, boolean>>>(
    {},
  );
  const [isLocating, setIsLocating] = useState(false);

  const logo = useImageField(MAX_LOGO_MB);
  const banner = useImageField(MAX_BANNER_MB);
  const { setExisting: setLogoExisting } = logo;
  const { setExisting: setBannerExisting } = banner;

  const {
    data: storeRes,
    isLoading: isStoreLoading,
    isError: isStoreError,
    error: storeError,
    refetch,
  } = useGetMyStoreByIdQuery(storeId as string, { skip: !isEditMode });

  const [createStore, { isLoading: isCreating }] = useCreateStoreMutation();
  const [updateMyStore, { isLoading: isUpdating }] = useUpdateMyStoreMutation();
  const isSubmitting = isCreating || isUpdating;

  const store = storeRes?.data;

  /* ----------------------- Populate form in edit mode ---------------------- */
  useEffect(() => {
    if (!isEditMode || !store) return;

    const coords = store.location?.coordinates;
    const [lng, lat] = coords && coords.length === 2 ? coords : [null, null];

    setForm({
      store_name: store.store_name ?? "",
      store_description: store.store_description ?? "",
      email: store.email ?? "",
      phone: store.phone ?? "",
      address: store.address ?? "",
      country: store.country ?? "",
      state: store.state ?? "",
      city: store.city ?? "",
      postal_code: store.postal_code ?? "",
      gst_number: store.gst_number ?? "",
      latitude: lat !== null ? String(lat) : "",
      longitude: lng !== null ? String(lng) : "",
      is_default: Boolean(store.is_default),
    });
    setTouched({});
    setLogoExisting(store.store_logo ? assetUrl(store.store_logo) : null);
    setBannerExisting(store.store_banner ? assetUrl(store.store_banner) : null);
  }, [isEditMode, store, setLogoExisting, setBannerExisting]);

  /* ------------------------------- Validation ------------------------------ */
  const errors = useMemo(() => validate(form), [form]);
  const visibleError = (key: TextField): string =>
    touched[key] ? (errors[key] ?? "") : "";

  const isFormValid =
    Object.keys(errors).length === 0 && !logo.error && !banner.error;

  const markTouched = (key: TextField) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const onText =
    (key: TextField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((p) => ({ ...p, [key]: value }));
    };

  /* ------------------------------ Geolocation ------------------------------ */
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not supported", {
        description:
          "Your browser can't share your location. Enter it manually.",
      });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        toast.error("Couldn't get your location", {
          description:
            "Allow location access in your browser, or enter the coordinates manually.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  /* -------------------------------- Submit --------------------------------- */
  const buildPayload = (): CreateStorePayload => {
    const hasCoords =
      form.latitude.trim() !== "" && form.longitude.trim() !== "";

    return {
      store_name: form.store_name.trim(),
      store_description: form.store_description.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      country: form.country.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      postal_code: form.postal_code.trim(),
      gst_number: form.gst_number.trim().toUpperCase(),
      latitude: hasCoords ? form.latitude.trim() : undefined,
      longitude: hasCoords ? form.longitude.trim() : undefined,
      is_default: form.is_default,
      store_logo: logo.file,
      store_banner: banner.file,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reveal every validation message on submit.
    setTouched({
      store_name: true,
      store_description: true,
      email: true,
      phone: true,
      address: true,
      country: true,
      state: true,
      city: true,
      postal_code: true,
      gst_number: true,
      latitude: true,
      longitude: true,
    });

    if (!isFormValid) {
      toast.error("Please fix the highlighted fields", {
        description: "Some details are missing or invalid.",
      });
      return;
    }

    const payload = buildPayload();
    const name = payload.store_name;

    try {
      if (isEditMode && storeId) {
        const updatePayload: UpdateStorePayload = {
          storeId,
          ...payload,
          ...(logo.removed && !logo.file ? { remove_logo: true } : {}),
          ...(banner.removed && !banner.file ? { remove_banner: true } : {}),
        };
        await updateMyStore(updatePayload).unwrap();
        toast.success("Store updated", {
          description: `"${name}" has been updated successfully.`,
        });
      } else {
        await createStore(toFormData(payload)).unwrap();
        toast.success("Store created", {
          description: `"${name}" has been created. It will be visible once verified.`,
        });
      }
      navigate(STORE_LIST_PATH);
    } catch (err) {
      console.error("Store operation failed:", err);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} store`, {
        description: getErrorMessage(err),
      });
    }
  };

  const handleCancel = () => navigate(STORE_LIST_PATH);

  /* ------------------------------ Render guards ---------------------------- */
  if (isEditMode && isStoreLoading) {
    return (
      <FullScreenLoader
        title="Loading Store"
        subtitle="Retrieving store details..."
      />
    );
  }

  if (isEditMode && (isStoreError || !store)) {
    const status = (storeError as { status?: number } | undefined)?.status;
    return (
      <div className="cc-page">
        <div className="container-fluid cc-container">
          <div className="cc-card st-state-card">
            <h2>
              {status === 404 ? "Store not found" : "Couldn't load store"}
            </h2>
            <p>
              {status === 404
                ? "This store doesn't exist or you don't have access to it."
                : getErrorMessage(storeError)}
            </p>
            <div className="cc-actions">
              <button
                type="button"
                className="btn cc-btn-ghost"
                onClick={handleCancel}
              >
                Back to stores
              </button>
              {status !== 404 && (
                <button
                  type="button"
                  className="btn cc-btn-primary"
                  onClick={() => refetch()}
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------- Field render helper ------------------------- */
  interface FieldOptions {
    placeholder?: string;
    type?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    required?: boolean;
    hint?: string;
  }

  const renderInput = (
    key: TextField,
    label: string,
    {
      placeholder,
      type = "text",
      inputMode,
      required,
      hint,
    }: FieldOptions = {},
  ) => {
    const err = visibleError(key);
    return (
      <div className="cc-field">
        <label htmlFor={`st-${key}`}>
          {label}
          {required && <span className="st-required"> *</span>}
        </label>
        <input
          id={`st-${key}`}
          type={type}
          inputMode={inputMode}
          className={`form-control cc-input ${err ? "is-invalid" : ""}`}
          placeholder={placeholder}
          value={form[key]}
          onChange={onText(key)}
          onBlur={() => markTouched(key)}
          aria-invalid={Boolean(err)}
        />
        {err ? (
          <div className="cc-error">{err}</div>
        ) : hint ? (
          <div className="cc-hint">{hint}</div>
        ) : null}
      </div>
    );
  };

  const descError = visibleError("store_description");
  const addressError = visibleError("address");

  const addressLine = [form.city, form.state, form.country]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="cc-page">
      <div className="container-fluid cc-container">
        <div className="cc-header">
          <div>
            <p className="cc-eyebrow">Store Manager</p>
            <h1 className="cc-title">
              {isEditMode ? "Edit Store" : "Add Store"}
            </h1>
            <p className="cc-subtitle">
              {isEditMode
                ? "Update your store details."
                : "Set up a new store for your business."}
            </p>
          </div>
        </div>

        {isEditMode && store?.verification_status === "rejected" && (
          <div className="st-alert st-alert--danger" role="alert">
            <strong>Verification was rejected.</strong>{" "}
            {store.rejection_reason ||
              "Update your details and save to request review again."}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="cc-fieldset" disabled={isSubmitting}>
            <div className="row g-4 cc-body">
              <div className="col-12 col-lg-8">
                {/* ------------------------- Basic info ------------------------ */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">01</span>
                    <div>
                      <h2>Store details</h2>
                      <p>The name and description customers see.</p>
                    </div>
                  </header>

                  {renderInput("store_name", "Store name", {
                    placeholder: "e.g. Fresh Basket Mohali",
                    required: true,
                  })}

                  <div className="cc-field">
                    <label htmlFor="st-store_description">Description</label>
                    <textarea
                      id="st-store_description"
                      className={`form-control cc-input cc-textarea ${
                        descError ? "is-invalid" : ""
                      }`}
                      placeholder="Tell customers what your store sells…"
                      rows={4}
                      value={form.store_description}
                      onChange={onText("store_description")}
                      onBlur={() => markTouched("store_description")}
                    />
                    <div className="cc-field-footer">
                      {descError ? (
                        <span className="cc-error">{descError}</span>
                      ) : (
                        <span className="cc-hint">
                          Shown on your store page and in search results.
                        </span>
                      )}
                      <span className="cc-count">
                        {form.store_description.length}/{MAX_DESC_LENGTH}
                      </span>
                    </div>
                  </div>
                </section>

                {/* --------------------------- Contact ------------------------- */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">02</span>
                    <div>
                      <h2>Contact &amp; tax</h2>
                      <p>How customers and our team can reach this store.</p>
                    </div>
                  </header>

                  <div className="st-grid-2">
                    {renderInput("email", "Email", {
                      type: "email",
                      placeholder: "store@example.com",
                    })}
                    {renderInput("phone", "Phone", {
                      type: "tel",
                      inputMode: "tel",
                      placeholder: "+91 98765 43210",
                    })}
                  </div>

                  {renderInput("gst_number", "GST number", {
                    placeholder: "22AAAAA0000A1Z5",
                    hint: "Optional. 15-character GSTIN.",
                  })}
                </section>

                {/* --------------------------- Address ------------------------- */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">03</span>
                    <div>
                      <h2>Address</h2>
                      <p>Where this store is located.</p>
                    </div>
                  </header>

                  <div className="cc-field">
                    <label htmlFor="st-address">
                      Street address<span className="st-required"> *</span>
                    </label>
                    <textarea
                      id="st-address"
                      className={`form-control cc-input cc-textarea ${
                        addressError ? "is-invalid" : ""
                      }`}
                      placeholder="Shop no., street, landmark"
                      rows={3}
                      value={form.address}
                      onChange={onText("address")}
                      onBlur={() => markTouched("address")}
                      aria-invalid={Boolean(addressError)}
                    />
                    {addressError && (
                      <div className="cc-error">{addressError}</div>
                    )}
                  </div>

                  <div className="st-grid-2">
                    {renderInput("city", "City", { placeholder: "Mohali" })}
                    {renderInput("state", "State", { placeholder: "Punjab" })}
                    {renderInput("country", "Country", {
                      placeholder: "India",
                    })}
                    {renderInput("postal_code", "Postal code", {
                      placeholder: "160055",
                      inputMode: "text",
                    })}
                  </div>
                </section>

                {/* -------------------------- Location ------------------------- */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">04</span>
                    <div>
                      <h2>Map location</h2>
                      <p>
                        Optional. Used to show your store to nearby customers.
                      </p>
                    </div>
                  </header>

                  <div className="st-grid-2">
                    {renderInput("latitude", "Latitude", {
                      inputMode: "decimal",
                      placeholder: "30.704649",
                    })}
                    {renderInput("longitude", "Longitude", {
                      inputMode: "decimal",
                      placeholder: "76.717873",
                    })}
                  </div>

                  <button
                    type="button"
                    className="btn cc-btn-ghost st-locate-btn"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                  >
                    {isLocating && <Spinner />}
                    {isLocating ? "Locating…" : "Use my current location"}
                  </button>
                </section>

                {/* --------------------------- Branding ------------------------ */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">05</span>
                    <div>
                      <h2>Logo &amp; banner</h2>
                      <p>Your store's identity across the app.</p>
                    </div>
                  </header>

                  <div className="cc-field">
                    <label>Store logo</label>
                    <ImageUpload
                      variant="logo"
                      preview={logo.preview}
                      error={logo.error}
                      hint={`Square · up to ${MAX_LOGO_MB}MB`}
                      onSelect={logo.select}
                      onRemove={logo.remove}
                    />
                  </div>

                  <div className="cc-field">
                    <label>Store banner</label>
                    <ImageUpload
                      variant="banner"
                      preview={banner.preview}
                      error={banner.error}
                      hint={`Wide image (e.g. 1200×400) · up to ${MAX_BANNER_MB}MB`}
                      onSelect={banner.select}
                      onRemove={banner.remove}
                    />
                  </div>
                </section>

                {/* --------------------------- Settings ------------------------ */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">06</span>
                    <div>
                      <h2>Settings</h2>
                      <p>Choose how this store is used on your account.</p>
                    </div>
                  </header>

                  <label className="st-check" htmlFor="st-is_default">
                    <input
                      id="st-is_default"
                      type="checkbox"
                      checked={form.is_default}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, is_default: e.target.checked }))
                      }
                    />
                    <span>
                      <strong>Make this my default store</strong>
                      <small>
                        New products and orders use this store unless you pick
                        another.
                      </small>
                    </span>
                  </label>
                </section>

                <div className="cc-actions">
                  <button
                    type="button"
                    className="btn cc-btn-ghost"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn cc-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Saving…"
                        : "Creating…"
                      : isEditMode
                        ? "Save changes"
                        : "Create store"}
                  </button>
                </div>
              </div>

              {/* ------------------------ Live preview ------------------------ */}
              <div className="col-12 col-lg-4">
                <div className="cc-sticky">
                  <div className="cc-preview-card">
                    <p className="cc-preview-label">Live preview</p>
                    <div className="cc-tile st-tile">
                      <div className="st-tile-banner">
                        {banner.preview ? (
                          <img src={banner.preview} alt="" />
                        ) : (
                          <span className="cc-tile-placeholder">
                            No banner yet
                          </span>
                        )}
                      </div>
                      <div className="st-tile-logo">
                        {logo.preview ? (
                          <img src={logo.preview} alt="" />
                        ) : (
                          <span>{form.store_name.trim().charAt(0) || "S"}</span>
                        )}
                      </div>
                      <div className="cc-tile-body">
                        <p className="cc-tile-name">
                          {form.store_name || "Store name"}
                        </p>
                        <p className="cc-tile-desc">
                          {form.store_description ||
                            "Your store description will appear here as you type."}
                        </p>
                        {(form.address.trim() || addressLine) && (
                          <p className="cc-tile-desc st-tile-address">
                            {[form.address.trim(), addressLine]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        <div className="cc-tile-tags">
                          {form.is_default && (
                            <span className="cc-tag">Default</span>
                          )}
                          {isEditMode && store && (
                            <span className="cc-tag">
                              {store.verification_status === "verified"
                                ? "Verified"
                                : store.verification_status === "rejected"
                                  ? "Rejected"
                                  : "Pending verification"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default AddStore;
