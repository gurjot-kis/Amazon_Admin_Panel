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
  ShieldCheck,
  Clock,
  ShieldX,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  useFetchMyStoresQuery,
  useDeleteMyStoreMutation,
  useToggleMyStoreStatusMutation,
  useSetDefaultStoreMutation,
} from "../../../features/store/storeApi";
import type {
  Store,
  StoreVerificationStatus,
} from "../../../features/store/storeTypes";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";

import "../../../styles/store/VendorStoreList.css";

const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const VerificationBadge: React.FC<{ status: StoreVerificationStatus }> = ({
  status,
}) => {
  const config = {
    verified: {
      icon: ShieldCheck,
      label: "Verified",
      cls: "sc-badge--verified",
    },
    pending: {
      icon: Clock,
      label: "Pending Verification",
      cls: "sc-badge--pending",
    },
    rejected: { icon: ShieldX, label: "Rejected", cls: "sc-badge--rejected" },
  }[status] || { icon: Clock, label: status, cls: "sc-badge--pending" };

  const Icon = config.icon;

  return (
    <span className={`sc-verify-chip ${config.cls}`}>
      <Icon size={12} strokeWidth={2.4} />
      <span>{config.label}</span>
    </span>
  );
};

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
    <article
      className={`sc-card ${isActive ? "sc-card--active" : "sc-card--inactive"}`}
    >
      {/* ── Banner ── */}
      <div className="sc-banner">
        {store_banner ? (
          <img
            src={`${ASSET_URL}${store_banner}`}
            alt=""
            className="sc-banner-img"
          />
        ) : (
          <div className="sc-banner-fallback" />
        )}
        <div className="sc-banner-overlay" />

        {/* Top Badges */}
        <div className="sc-banner-badges">
          {is_default ? (
            <span className="sc-badge-glass sc-badge-glass--default">
              <Star size={11} fill="currentColor" />
              Primary Store
            </span>
          ) : (
            <span />
          )}

          <span
            className={`sc-status-indicator sc-status-indicator--${status}`}
          >
            <span className="sc-dot" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {/* Logo anchored over banner boundary */}
        <div className="sc-logo-frame">
          {store_logo ? (
            <img
              src={`${ASSET_URL}${store_logo}`}
              alt={store_name}
              className="sc-logo-img"
            />
          ) : (
            <div className="sc-logo-initials">{getInitials(store_name)}</div>
          )}
        </div>
      </div>

      {/* ── Content on Pure White Background ── */}
      <div className="sc-content">
        <div className="sc-title-block">
          <div className="sc-title-row">
            <h3 className="sc-store-name" title={store_name}>
              {store_name}
            </h3>
            <VerificationBadge status={verification_status} />
          </div>

          <p
            className={`sc-store-desc ${!store_description ? "sc-store-desc--empty" : ""}`}
          >
            {store_description || "No store description added."}
          </p>
        </div>

        <div className="sc-divider" />

        {/* Metadata Details */}
        <div className="sc-details-grid">
          <div className="sc-detail-cell">
            <span className="sc-detail-label">Location</span>
            <div className="sc-detail-value">
              <MapPin size={13} className="sc-detail-icon" />
              <span title={location || "Not configured"}>
                {location || "—"}
              </span>
            </div>
          </div>

          <div className="sc-detail-cell">
            <span className="sc-detail-label">Contact Email</span>
            <div className="sc-detail-value">
              <Mail size={13} className="sc-detail-icon" />
              <span title={email || "Not configured"}>{email || "—"}</span>
            </div>
          </div>

          {phone && (
            <div className="sc-detail-cell">
              <span className="sc-detail-label">Phone</span>
              <div className="sc-detail-value">
                <Phone size={13} className="sc-detail-icon" />
                <span>{phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="sc-action-bar">
        <button
          type="button"
          className="sc-btn-main"
          onClick={() => onEdit(store)}
        >
          <Pencil size={13} />
          Manage Store
        </button>

        <div className="sc-action-group">
          {!is_default && (
            <button
              type="button"
              className="sc-btn-tool"
              onClick={() => onSetDefault(_id)}
              title="Set as primary default store"
            >
              <Star size={14} />
            </button>
          )}

          <button
            type="button"
            className={`sc-btn-tool ${isActive ? "is-on" : "is-off"}`}
            onClick={() => onToggleStatus(_id)}
            title={isActive ? "Deactivate store" : "Activate store"}
          >
            <Power size={14} />
          </button>

          <button
            type="button"
            className="sc-btn-tool sc-btn-tool--danger"
            onClick={() => onDelete(store)}
            title="Delete store"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

const StoreList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const { data, isLoading, isError, isFetching } = useFetchMyStoresQuery({
    page,
    limit: 12,
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
        description: `"${storeName}" has been removed.`,
      });
    } catch (error: any) {
      toast.error("Failed to delete store", {
        description: error?.data?.message || "Something went wrong.",
      });
    }
  };

  const handleToggleStatus = async (storeId: string) => {
    try {
      await toggleMyStoreStatus(storeId).unwrap();
      toast.success("Store status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSetDefault = async (storeId: string) => {
    try {
      await setDefaultStore(storeId).unwrap();
      toast.success("Default store set");
    } catch {
      toast.error("Failed to set default store");
    }
  };

  if (isLoading) {
    return (
      <div className="sl-page">
        <div className="sl-loading-box">
          <div className="sl-spinner" />
          <p>Loading your stores…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="sl-page">
        <div className="sl-empty-state">
          <StoreIcon size={38} className="sl-empty-icon" />
          <h3>Unable to load stores</h3>
          <p>Something went wrong while fetching your data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-page">
      {/* ── Top Header ── */}
      <div className="sl-top-bar">
        <div>
          <div className="sl-title-group">
            <h1 className="sl-title">Stores</h1>
            {pagination && (
              <span className="sl-count-tag">{pagination.total} Stores</span>
            )}
          </div>
          <p className="sl-lead">
            Manage your retail branches, physical storefronts, and regional
            logistics
          </p>
        </div>

        <button
          type="button"
          className="sl-create-btn"
          onClick={() => navigate("/vendor/stores/add")}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add New Store</span>
        </button>
      </div>

      {/* ── Grid ── */}
      {stores.length === 0 ? (
        <div className="sl-empty-state">
          <div className="sl-empty-icon-wrap">
            <StoreIcon size={36} />
          </div>
          <h3>No stores registered</h3>
          <p>Create your first store location to start serving customers.</p>
          <button
            type="button"
            className="sl-create-btn"
            style={{ marginTop: 14 }}
            onClick={() => navigate("/vendor/stores/add")}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Store</span>
          </button>
        </div>
      ) : (
        <div
          className="sl-grid"
          style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 0.2s" }}
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

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="sl-pagination-bar">
          <span className="sl-page-indicator">
            Showing page <strong>{pagination.page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong>
          </span>
          <div className="sl-page-buttons">
            <button
              type="button"
              className="sl-nav-btn"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="sl-nav-btn"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
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
            <strong>"{selectedStore?.store_name}"</strong>? This will
            permanently remove its settings and disconnect attached inventory.
          </>
        }
      />
    </div>
  );
};

export default StoreList;
