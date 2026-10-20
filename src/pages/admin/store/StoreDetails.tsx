import React, { useEffect } from "react";
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

import {
  useGetStoreByIdQuery,
  useUpdateStoreVerificationMutation,
} from "../../../features/store/storeApi";
import type { StoreVerificationStatus } from "../../../features/store/storeTypes";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/store/storeDetail.css"

const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
        description: `Store is now ${newStatus}.`,
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="storedetail-state">
        <div className="storedetail-spinner" />
        <p>Loading store details…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
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

      {/* ── Banner + Logo ── */}
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

              {/* Verification select */}
              <div className="storedetail-verify-wrap">
                <select
                  className={`storedetail-verify-select storedetail-verify-select--${store.verification_status}`}
                  value={store.verification_status}
                  disabled={isUpdatingVerify}
                  onChange={(e) =>
                    handleVerificationChange(
                      e.target.value as StoreVerificationStatus,
                    )
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                {isUpdatingVerify && (
                  <span className="storedetail-verify-spinner" />
                )}
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
