import React, { useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Store as StoreIcon,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  Star,
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

const statusBadgeClass: Record<StoreStatus, string> = {
  active: "badge badge-status-active",
  inactive: "badge badge-status-inactive",
  suspended: "badge badge-status-suspended",
};

const verificationBadgeClass: Record<StoreVerificationStatus, string> = {
  verified: "badge badge-verified",
  pending: "badge badge-pending",
  rejected: "badge badge-rejected",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface StoreCardProps {
  store: Store;
  onEdit: (store: Store) => void;
  onDelete: (store: Store) => void; // now receives the whole store (for the modal)
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
    email,
    phone,
    address,
    city,
    state,
    status,
    verification_status,
    is_default,
  } = store;

  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div className="store-card white-glass-card">
      <div className="store-card-glow" />

      <div className="store-card-top-bar">
        {is_default ? (
          <span className="store-default-badge">DEFAULT</span>
        ) : (
          <span />
        )}
        <div className="store-card-badges">
          <span className={statusBadgeClass[status]}>
            <span className="badge-dot" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className={verificationBadgeClass[verification_status]}>
            {verification_status.charAt(0).toUpperCase() +
              verification_status.slice(1)}
          </span>
        </div>
      </div>

      <div className="store-card-hero">
        <div className="store-card-logo-wrap">
          {store_logo ? (
            <img src={`${ASSET_URL}${store_logo}`} alt={`${store_name} logo`} />
          ) : (
            <div className="store-logo-placeholder">
              {getInitials(store_name)}
            </div>
          )}
        </div>

        <h3 className="store-card-name" title={store_name}>
          {store_name}
        </h3>

        {store_description && (
          <p className="store-card-desc">{store_description}</p>
        )}
      </div>

      <div className="store-card-body">
        <div className="store-card-meta-list">
          {location && (
            <div className="store-meta-row">
              <MapPin size={15} />
              <span>{location}</span>
            </div>
          )}
          {email && (
            <div className="store-meta-row">
              <Mail size={15} />
              <span>{email}</span>
            </div>
          )}
          {phone && (
            <div className="store-meta-row">
              <Phone size={15} />
              <span>{phone}</span>
            </div>
          )}
          {!location && address && (
            <div className="store-meta-row">
              <MapPin size={15} />
              <span>{address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="store-card-footer">
        <button
          className="store-btn store-btn-primary"
          onClick={() => onEdit(store)}
        >
          <Pencil size={14} />
          <span>Edit</span>
        </button>

        <button
          className="store-btn store-btn-glass"
          onClick={() => onToggleStatus(_id)}
        >
          <ToggleLeft size={15} />
          <span>{status === "active" ? "Deactivate" : "Activate"}</span>
        </button>

        {!is_default && (
          <button
            className="store-btn store-btn-glass"
            onClick={() => onSetDefault(_id)}
            title="Set as default"
          >
            <Star size={14} />
            <span>Default</span>
          </button>
        )}

        <button
          className="store-btn store-btn-danger"
          onClick={() => onDelete(store)}
          title="Delete store"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

const StoreList: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoreStatus | "">("");
  const [verificationFilter, setVerificationFilter] = useState<
    StoreVerificationStatus | ""
  >("");

  // delete modal state
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

  const handleEdit = (store: Store) => {
    navigate(`/vendor/store/${store._id}/edit`);
    console.log("Edit store:", store._id);
  };

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
      console.error("Failed to delete store:", error);
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete store", {
        description: errMsg,
      });
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
      <div className="store-list-page">
        <div className="store-list-state">
          <StoreIcon size={42} />
          <p>Loading your stores…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="store-list-page">
        <div className="store-list-state">
          <StoreIcon size={42} />
          <h3>Something went wrong</h3>
          <p>We couldn't load your stores. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-list-page">
      {/* Header */}
      <div className="store-list-header">
        <h1>
          My Stores
          {pagination && (
            <span className="store-count">({pagination.total})</span>
          )}
        </h1>

        <button
          className="btn-create-store"
          onClick={() => navigate("/vendor/store/add")}
        >
          <Plus size={16} />
          Add Store
        </button>
      </div>

      {/* Filters */}
      <div className="store-list-filters">
        <input
          className="store-filter-input"
          type="text"
          placeholder="Search stores…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="store-filter-select"
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
          className="store-filter-select"
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

      {/* Cards Grid */}
      {stores.length === 0 ? (
        <div className="store-list-state">
          <StoreIcon size={42} />
          <h3>No stores found</h3>
          <p>
            {search || statusFilter || verificationFilter
              ? "Try adjusting your filters."
              : "Create your first store to get started."}
          </p>
        </div>
      ) : (
        <div
          className="store-cards-grid"
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="store-list-pagination">
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <button
            className="pagination-btn"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
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
