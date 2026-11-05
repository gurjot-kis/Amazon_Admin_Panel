import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LuMapPin,
  LuMail,
  LuPhone,
  LuBuilding2,
  LuCalendar,
  LuBadgeCheck,
  LuArrowLeft,
  LuStore,
} from "react-icons/lu";
import { ShieldCheck, Clock, ShieldX, Check } from "lucide-react";

import {
  useGetStoreByIdQuery,
  useUpdateStoreVerificationMutation,
} from "../../../features/store/storeApi";
import type { StoreVerificationStatus } from "../../../features/store/storeTypes";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/store/storeDetail.css";

const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

const VERIFY_CONFIG: Record<
  StoreVerificationStatus,
  {
    label: string;
    className: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  verified: {
    label: "Verified",
    className: "store-v--verified",
    icon: ShieldCheck,
  },
  pending: {
    label: "Pending",
    className: "store-v--pending",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    className: "store-v--rejected",
    icon: ShieldX,
  },
};

/* ── Custom Verification Dropdown ── */
const StoreDetailVerificationDropdown = ({
  current,
  onUpdate,
  isUpdating,
}: {
  current: StoreVerificationStatus;
  onUpdate: (status: StoreVerificationStatus) => void;
  isUpdating: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cfg = VERIFY_CONFIG[current] || VERIFY_CONFIG.pending;
  const CurrentIcon = cfg.icon;

  const toggleDropdown = () => {
    if (isUpdating) return;

    setOpen((prev) => {
      if (!prev && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
        });
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        btnRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="store-v-dropdown-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`store-v-badge ${cfg.className} ${isUpdating ? "is-updating" : ""}`}
        onClick={toggleDropdown}
        disabled={isUpdating}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isUpdating ? (
          <span className="store-v-spinner" />
        ) : (
          <CurrentIcon size={13} className="store-v-badge-icon" />
        )}
        <span>{cfg.label}</span>
        {!isUpdating && (
          <svg
            className={`store-v-chevron ${open ? "is-open" : ""}`}
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="store-v-panel"
            role="listbox"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
          >
            {(Object.keys(VERIFY_CONFIG) as StoreVerificationStatus[]).map(
              (statusKey) => {
                const optionCfg = VERIFY_CONFIG[statusKey];
                const OptionIcon = optionCfg.icon;
                const isActive = statusKey === current;

                return (
                  <button
                    key={statusKey}
                    type="button"
                    className={`store-v-option ${optionCfg.className} ${
                      isActive ? "is-active" : ""
                    }`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      if (!isActive) onUpdate(statusKey);
                      setOpen(false);
                    }}
                  >
                    <OptionIcon size={14} className="store-v-option-icon" />
                    <span className="store-v-option-label">
                      {optionCfg.label}
                    </span>
                    {isActive && <Check size={14} className="store-v-check" />}
                  </button>
                );
              },
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StoreDetails(): React.ReactElement {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const { data, isLoading, isError, error } = useGetStoreByIdQuery(
    storeId ?? "",
    { skip: !storeId },
  );

  const [updateStoreVerification, { isLoading: isUpdatingVerify }] =
    useUpdateStoreVerificationMutation();

  const store = data?.data;

  useEffect(() => {
    setHeaderConfig({
      title: store?.store_name ?? "Store Details",
      subtitle: "View complete store information",
    });
  }, [setHeaderConfig, store?.store_name]);

  const handleVerificationChange = async (
    newStatus: StoreVerificationStatus,
  ) => {
    if (!storeId) return;
    try {
      await updateStoreVerification({
        storeId,
        verification_status: newStatus,
      }).unwrap();
      toast.success("Verification updated", {
        description: `Store is now marked as ${newStatus}.`,
      });
    } catch (err: any) {
      toast.error("Failed to update verification", {
        description:
          err?.data?.message ?? "Could not update. Please try again.",
      });
    }
  };

  const getVendor = () => {
    if (!store) return null;
    if (typeof store.vendor_id === "object" && store.vendor_id !== null)
      return store.vendor_id;
    if (store.vendor) return store.vendor;
    return null;
  };

  const getInitials = (name?: string): string => {
    if (!name?.trim()) return "S";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (
      words[0].charAt(0).toUpperCase() +
      words[words.length - 1].charAt(0).toUpperCase()
    );
  };

  if (isLoading) {
    return (
      <div className="storedetail-state">
        <div className="storedetail-spinner" />
        <p>Loading store details…</p>
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="storedetail-state storedetail-state--error">
        <LuStore size={40} />
        <p>
          {isError && error && "status" in error
            ? `Failed to load store (${error.status})`
            : "Store not found."}
        </p>
        <button className="storedetail-back-btn" onClick={() => navigate(-1)}>
          <LuArrowLeft size={15} /> Go Back
        </button>
      </div>
    );
  }

  const vendor = getVendor();
  const location = [store.city, store.state, store.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="storedetail-page">
      {/* ── Back ── */}
      <button className="storedetail-back-btn" onClick={() => navigate(-1)}>
        <LuArrowLeft size={15} /> Back to Stores
      </button>

      {/* ── Hero (banner + logo + name) ── */}
      <div className="storedetail-hero">
        <div className="storedetail-banner">
          {store.store_banner ? (
            <img
              src={`${ASSET_URL}${store.store_banner}`}
              alt="Store banner"
              className="storedetail-banner-img"
            />
          ) : (
            <div className="storedetail-banner-placeholder" />
          )}
        </div>

        <div className="storedetail-hero-body">
          <div className="storedetail-logo">
            {store.store_logo ? (
              <img
                src={`${ASSET_URL}${store.store_logo}`}
                alt={store.store_name}
                className="storedetail-logo-img"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (
                    e.currentTarget.nextElementSibling as HTMLElement
                  ).style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="storedetail-logo-initials"
              style={{ display: store.store_logo ? "none" : "flex" }}
            >
              {getInitials(store.store_name)}
            </span>
          </div>

          <div className="storedetail-hero-info">
            <div className="storedetail-hero-top">
              <div>
                <h1 className="storedetail-store-name">{store.store_name}</h1>
                {location && (
                  <span className="storedetail-location">
                    <LuMapPin size={13} className="storedetail-location-icon" />
                    {location}
                  </span>
                )}
              </div>

              {/* Custom verification dropdown */}
              <div className="storedetail-verify-wrap">
                <StoreDetailVerificationDropdown
                  current={store.verification_status}
                  onUpdate={handleVerificationChange}
                  isUpdating={isUpdatingVerify}
                />
              </div>
            </div>

            {store.store_description && (
              <p className="storedetail-description">
                {store.store_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="storedetail-grid">
        {/* ── Contact & Address ── */}
        <div className="storedetail-card">
          <h2 className="storedetail-card-title">
            <LuMail size={15} /> Contact & Address
          </h2>
          <dl className="storedetail-dl">
            <div className="storedetail-dl-row">
              <dt>Email</dt>
              <dd>
                {store.email ? (
                  <a
                    href={`mailto:${store.email}`}
                    className="storedetail-link"
                  >
                    <LuMail size={13} /> {store.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Phone</dt>
              <dd>
                {store.phone ? (
                  <a href={`tel:${store.phone}`} className="storedetail-link">
                    <LuPhone size={13} /> {store.phone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Address</dt>
              <dd>{store.address || "—"}</dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>City</dt>
              <dd>{store.city || "—"}</dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>State</dt>
              <dd>{store.state || "—"}</dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Country</dt>
              <dd>{store.country || "—"}</dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Postal Code</dt>
              <dd>{store.postal_code || "—"}</dd>
            </div>
            {store.location && (
              <div className="storedetail-dl-row">
                <dt>Coordinates</dt>
                <dd>
                  {store.location.coordinates[1]}°N,{" "}
                  {store.location.coordinates[0]}°E
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* ── Business Info ── */}
        <div className="storedetail-card">
          <h2 className="storedetail-card-title">
            <LuBuilding2 size={15} /> Business Info
          </h2>
          <dl className="storedetail-dl">
            <div className="storedetail-dl-row">
              <dt>GST Number</dt>
              <dd>
                {store.gst_number ? (
                  <span className="storedetail-mono">{store.gst_number}</span>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Status</dt>
              <dd>
                <span
                  className={`storedetail-status-badge storedetail-status-badge--${store.status}`}
                >
                  {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                </span>
              </dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Default Store</dt>
              <dd>{store.is_default ? "Yes" : "No"}</dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Verification</dt>
              <dd>
                <span
                  className={`storedetail-status-badge storedetail-status-badge--${store.verification_status}`}
                >
                  {store.verification_status.charAt(0).toUpperCase() +
                    store.verification_status.slice(1)}
                </span>
              </dd>
            </div>
            {store.verified_at && (
              <div className="storedetail-dl-row">
                <dt>Verified At</dt>
                <dd>{formatDateTime(store.verified_at)}</dd>
              </div>
            )}
            {store.rejection_reason && (
              <div className="storedetail-dl-row">
                <dt>Rejection Reason</dt>
                <dd className="storedetail-rejection">
                  {store.rejection_reason}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* ── Vendor Info ── */}
        <div className="storedetail-card">
          <h2 className="storedetail-card-title">
            <LuBadgeCheck size={15} /> Vendor
          </h2>
          {vendor ? (
            <div className="storedetail-vendor">
              <div className="storedetail-vendor-avatar">
                {vendor.profilePicture ? (
                  <img
                    src={`${ASSET_URL}${vendor.profilePicture}`}
                    alt={vendor.name}
                    className="storedetail-vendor-avatar-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                      (
                        e.currentTarget.nextElementSibling as HTMLElement
                      ).style.display = "flex";
                    }}
                  />
                ) : null}
                <span
                  className="storedetail-vendor-initials"
                  style={{ display: vendor.profilePicture ? "none" : "flex" }}
                >
                  {getInitials(vendor.name)}
                </span>
              </div>
              <div className="storedetail-vendor-info">
                <span className="storedetail-vendor-name">{vendor.name}</span>
                {vendor.email && (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="storedetail-link storedetail-vendor-meta"
                  >
                    <LuMail size={12} /> {vendor.email}
                  </a>
                )}
                {vendor.phone && (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="storedetail-link storedetail-vendor-meta"
                  >
                    <LuPhone size={12} /> {vendor.phone}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="storedetail-empty">
              No vendor information available.
            </p>
          )}
        </div>

        {/* ── Timestamps ── */}
        <div className="storedetail-card">
          <h2 className="storedetail-card-title">
            <LuCalendar size={15} /> Timestamps
          </h2>
          <dl className="storedetail-dl">
            <div className="storedetail-dl-row">
              <dt>Created At</dt>
              <dd>{formatDateTime(store.createdAt)}</dd>
            </div>
            <div className="storedetail-dl-row">
              <dt>Last Updated</dt>
              <dd>{formatDateTime(store.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
