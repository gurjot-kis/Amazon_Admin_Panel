import React, { useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Store as StoreIcon,
  Plus,
  Pencil,
  Trash2,
  Star,
  ToggleLeft,
  ShieldCheck,
  Clock,
  ShieldX,
} from "lucide-react";
import { toast } from "sonner";

import {
  useFetchMyStoresQuery,
  useDeleteMyStoreMutation,
  useToggleMyStoreStatusMutation,
  useSetDefaultStoreMutation,
} from "../../../features/store/storeApi";
import type {
  Store,
  StoreStatus,
  StoreVerificationStatus,
} from "../../../features/store/storeTypes";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";

import "../../../styles/store/VendorStoreList.css";
import { useNavigate } from "react-router-dom";

const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

// ─── helpers ────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const VerificationIcon: React.FC<{ status: StoreVerificationStatus }> = ({
  status,
}) => {
  if (status === "verified")
    return <ShieldCheck size={13} className="v-icon verified" />;
  if (status === "pending")
    return <Clock size={13} className="v-icon pending" />;
  return <ShieldX size={13} className="v-icon rejected" />;
};

// ─── Store Card ──────────────────────────────────────────────────────────────

interface StoreCardProps {
  store: Store;
  onEdit: (store: Store) => void;
  onDelete: (store: Store) => void;
  onToggleStatus: (storeId: string) => void;
  onSetDefault: (storeId: string) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({
  store,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetDefault,
}) => {
  const {
    _id,
    store_name,
    store_description,
    store_logo,
    store_banner,
    email,
    phone,
    address,
    city,
    state,
    status,
    verification_status,
    is_default,
  } = store;

  const location = [city, state].filter(Boolean).join(", ") || address;
  const isActive = status === "active";

  return (
    <div className={`sc-card ${isActive ? "sc-active" : "sc-inactive"}`}>
      {/* ── Banner ── */}
      <div className="sc-banner">
        {store_banner ? (
          <img
            src={`${ASSET_URL}${store_banner}`}
            alt=""
            className="sc-banner-img"
          />
        ) : (
          <div className="sc-banner-placeholder" aria-hidden="true" />
        )}

        {/* Overlay gradient for readability */}
        <div className="sc-banner-overlay" />

        {/* Top-left: DEFAULT pill */}
        {is_default && (
          <span className="sc-pill sc-pill-default">
            <Star size={10} fill="currentColor" />
            Default
          </span>
        )}

        {/* Top-right: status dot */}
        <span className={`sc-status-dot sc-status-${status}`} title={status} />
      </div>

      {/* ── Identity Row: logo + name/desc ── */}
      <div className="sc-identity">
        <div className="sc-logo-wrap">
          {store_logo ? (
            <img
              src={`${ASSET_URL}${store_logo}`}
              alt={`${store_name} logo`}
              className="sc-logo-img"
            />
          ) : (
            <div className="sc-logo-initials">{getInitials(store_name)}</div>
          )}
        </div>

        <div className="sc-name-block">
          <div className="sc-name-row">
            <h3 className="sc-name" title={store_name}>
              {store_name}
            </h3>
            <span
              className={`sc-verification sc-verification-${verification_status}`}
            >
              <VerificationIcon status={verification_status} />
              {verification_status.charAt(0).toUpperCase() +
                verification_status.slice(1)}
            </span>
          </div>
          {store_description && <p className="sc-desc">{store_description}</p>}
        </div>
      </div>

      {/* ── Meta ── */}
      <ul className="sc-meta">
        {location && (
          <li>
            <MapPin size={13} />
            <span>{location}</span>
          </li>
        )}
        {email && (
          <li>
            <Mail size={13} />
            <span>{email}</span>
          </li>
        )}
        {phone && (
          <li>
            <Phone size={13} />
            <span>{phone}</span>
          </li>
        )}
      </ul>

      {/* ── Status pill row ── */}
      <div className="sc-status-row">
        <span className={`sc-badge sc-badge-${status}`}>
          <span className="sc-badge-dot" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* ── Footer actions ── */}
      <div className="sc-footer">
        <button className="sc-btn sc-btn-primary" onClick={() => onEdit(store)}>
          <Pencil size={13} />
          Edit
        </button>

        <button
          className="sc-btn sc-btn-outline"
          onClick={() => onToggleStatus(_id)}
        >
          <ToggleLeft size={14} />
          {isActive ? "Deactivate" : "Activate"}
        </button>

        {!is_default && (
          <button
            className="sc-btn sc-btn-outline"
            onClick={() => onSetDefault(_id)}
            title="Set as default store"
          >
            <Star size={13} />
            Set Default
          </button>
        )}

        <button
          className="sc-btn sc-btn-danger"
          onClick={() => onDelete(store)}
          title="Delete store"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Store List Page ─────────────────────────────────────────────────────────

const StoreList: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoreStatus | "">("");
  const [verificationFilter, setVerificationFilter] = useState<
    StoreVerificationStatus | ""
  >("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const { data, isLoading, isError, isFetching } = useFetchMyStoresQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
    verification_status: verificationFilter || undefined,
  });

  const [deleteMyStore, { isLoading: isDeleting }] = useDeleteMyStoreMutation();
  const [toggleMyStoreStatus] = useToggleMyStoreStatusMutation();
  const [setDefaultStore] = useSetDefaultStoreMutation();

  const stores = data?.data ?? [];
  const pagination = data?.pagination;

  const handleEdit = (store: Store) =>
    navigate(`/vendor/stores/${store._id}/edit`);

  const openDeleteModal = (store: Store) => {
    setSelectedStore(store);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedStore(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStore) return;
    const storeName = selectedStore.store_name;
    try {
      await deleteMyStore(selectedStore._id).unwrap();
      closeDeleteModal();
      toast.success("Store deleted", {
        description: `"${storeName}" has been successfully removed.`,
      });
    } catch (error: any) {
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete store", { description: errMsg });
    }
  };

  const handleToggleStatus = async (storeId: string) => {
    try {
      await toggleMyStoreStatus(storeId).unwrap();
    } catch {
      console.error("Failed to toggle store status");
    }
  };

  const handleSetDefault = async (storeId: string) => {
    try {
      await setDefaultStore(storeId).unwrap();
    } catch {
      console.error("Failed to set default store");
    }
  };

  if (isLoading) {
    return (
      <div className="sl-page">
        <div className="sl-state">
          <StoreIcon size={40} />
          <p>Loading your stores…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="sl-page">
        <div className="sl-state">
          <StoreIcon size={40} />
          <h3>Something went wrong</h3>
          <p>We couldn't load your stores. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-page">
      {/* Header */}
      <div className="sl-header">
        <div className="sl-header-left">
          <h1 className="sl-title">My Stores</h1>
          {pagination && (
            <span className="sl-count">
              {pagination.total} store{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          className="sl-add-btn"
          onClick={() => navigate("/vendor/stores/add")}
        >
          <Plus size={15} />
          Add Store
        </button>
      </div>

      {/* Filters */}
      <div className="sl-filters">
        <div className="sl-search-wrap">
          <svg
            className="sl-search-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="sl-search"
            type="text"
            placeholder="Search by name, city, email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="sl-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StoreStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          className="sl-select"
          value={verificationFilter}
          onChange={(e) => {
            setVerificationFilter(
              e.target.value as StoreVerificationStatus | "",
            );
            setPage(1);
          }}
        >
          <option value="">All verifications</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Grid */}
      {stores.length === 0 ? (
        <div className="sl-state">
          <StoreIcon size={40} />
          <h3>No stores found</h3>
          <p>
            {search || statusFilter || verificationFilter
              ? "Try adjusting your filters."
              : "Create your first store to get started."}
          </p>
        </div>
      ) : (
        <div
          className="sl-grid"
          style={{ opacity: isFetching ? 0.55 : 1, transition: "opacity 0.2s" }}
        >
          {stores.map((store) => (
            <StoreCard
              key={store._id}
              store={store}
              onEdit={handleEdit}
              onDelete={openDeleteModal}
              onToggleStatus={handleToggleStatus}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="sl-pagination">
          <span className="sl-page-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="sl-page-btn"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <button
            className="sl-page-btn"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Store"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedStore?.store_name}"</strong>? This action cannot
            be undone.
          </>
        }
      />
    </div>
  );
};

export default StoreList;
