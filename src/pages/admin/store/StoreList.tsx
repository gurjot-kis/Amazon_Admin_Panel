// src/pages/admin/store/StoreList.tsx

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LuPhone, LuMail, LuMapPin } from "react-icons/lu";
import { MdVisibility } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  useFetchAllStoresQuery,
  useUpdateStoreVerificationMutation,
} from "../../../features/store/storeApi";
import type {
  Store,
  StoreVerificationStatus,
} from "../../../features/store/storeTypes";
import { DataTable } from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/store/AdminStoreList.css";

const PAGE_LIMIT = 10;
const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

export default function StoreList(): React.ReactElement {
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [page, setPage] = useState<number>(1);
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [updatingVerify, setUpdatingVerify] = useState<string | null>(null);

  useEffect(() => {
    setHeaderConfig({
      title: "Stores Management",
      subtitle: "View and manage stores, verification status, and availability",
    });
  }, [setHeaderConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useFetchAllStoresQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      verification_status:
        verificationFilter !== "all"
          ? (verificationFilter as StoreVerificationStatus)
          : undefined,
    });

  const [updateStoreVerification] = useUpdateStoreVerificationMutation();

  const rawStores = data?.data ?? [];
  const pagination = data?.pagination;

  const stores = useMemo(() => {
    if (!search) return rawStores;
    const lower = search.toLowerCase();
    return rawStores.filter(
      (s) =>
        s.store_name?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower) ||
        s.phone?.toLowerCase().includes(lower) ||
        s.city?.toLowerCase().includes(lower) ||
        s.address?.toLowerCase().includes(lower),
    );
  }, [rawStores, search]);

  const stats = useMemo(() => {
    const verified = stores.filter(
      (s) => s.verification_status === "verified",
    ).length;
    const pending = stores.filter(
      (s) => s.verification_status === "pending",
    ).length;
    const rejected = stores.filter(
      (s) => s.verification_status === "rejected",
    ).length;
    return {
      verified,
      pending,
      rejected,
      total: pagination?.total ?? stores.length,
    };
  }, [stores, pagination]);

  const handleVerificationChange = async (
    store: Store,
    newStatus: StoreVerificationStatus,
  ) => {
    setUpdatingVerify(store._id);
    try {
      await updateStoreVerification({
        storeId: store._id,
        verification_status: newStatus,
      }).unwrap();
      toast.success("Verification updated", {
        description: `"${store.store_name}" is now ${newStatus}.`,
      });
    } catch (err: any) {
      toast.error("Failed to update verification", {
        description:
          err?.data?.message ??
          "Could not update verification. Please try again.",
      });
    } finally {
      setUpdatingVerify(null);
    }
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

  const getVendorName = (store: Store): string => {
    if (typeof store.vendor_id === "object" && store.vendor_id !== null)
      return store.vendor_id.name || "—";
    if (store.vendor && typeof store.vendor === "object")
      return store.vendor.name || "—";
    return "—";
  };

  const columns: DataTableColumn<Store>[] = [
    {
      key: "store_name",
      header: "Store",
      isPrimary: true,
      render: (store) => (
        <div className="storelist-profile">
          <div className="storelist-avatar">
            {store.store_logo ? (
              <img
                src={`${ASSET_URL}${store.store_logo}`}
                alt={store.store_name}
                className="storelist-avatar-img"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (
                    e.currentTarget.nextElementSibling as HTMLElement
                  ).style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="storelist-avatar-initials"
              style={{ display: store.store_logo ? "none" : "flex" }}
            >
              {getInitials(store.store_name)}
            </span>
          </div>
          <div className="storelist-name-wrapper">
            <span className="storelist-name">{store.store_name || "—"}</span>
            <span className="storelist-subtext">{getVendorName(store)}</span>
            <span className="storelist-subtext d-md-none">
              {store.email || store.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (store) => (
        <div className="storelist-contact">
          {store.email && (
            <span className="storelist-contact-text">
              <LuMail size={14} className="storelist-icon" />
              <span>{store.email}</span>
            </span>
          )}
          {store.phone && (
            <span className="storelist-contact-text">
              <LuPhone size={14} className="storelist-icon" />
              <span>{store.phone}</span>
            </span>
          )}
          {!store.email && !store.phone && <span>—</span>}
        </div>
      ),
    },
    {
      key: "city",
      header: "Location",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (store) => {
        const parts = [store.city, store.state].filter(Boolean).join(", ");
        const text = parts || store.address || null;
        return text ? (
          <span className="storelist-location">
            <LuMapPin size={13} className="storelist-location-icon" />
            <span className="storelist-location-text">{text}</span>
          </span>
        ) : (
          <span>—</span>
        );
      },
    },
    {
      key: "verification_status",
      header: "Verification",
      render: (store) => (
        <div className="storelist-verify-cell">
          <select
            className={`storelist-verify-select storelist-verify-select--${store.verification_status}`}
            value={store.verification_status}
            disabled={updatingVerify === store._id}
            onChange={(e) =>
              handleVerificationChange(
                store,
                e.target.value as StoreVerificationStatus,
              )
            }
          >
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          {updatingVerify === store._id && (
            <span className="storelist-verify-spinner" />
          )}
          {store.verification_status === "rejected" &&
            store.rejection_reason && (
              <span
                className="storelist-rejection-hint"
                title={store.rejection_reason}
              >
                {store.rejection_reason.length > 30
                  ? `${store.rejection_reason.slice(0, 30)}…`
                  : store.rejection_reason}
              </span>
            )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (store) => (
        <div className="storelist-actions">
          <button
            type="button"
            className="storelist-action-btn"
            title="View Store"
            onClick={() => navigate(`/admin/store/${store._id}/details`)}
          >
            <MdVisibility color="#1b3a5c" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="storelist-page">
      <DataTable
        statPills={[
          { label: `${stats.total} total stores`, navy: true },
          { label: `${stats.verified} verified · this page` },
          { label: `${stats.pending} pending · this page` },
          { label: `${stats.rejected} rejected · this page` },
        ]}
        columns={columns}
        data={stores}
        getId={(s) => s._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, email, or city..."
        filters={[
          {
            value: verificationFilter,
            onChange: (v) => {
              setVerificationFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Verification" },
              { value: "pending", label: "Pending" },
              { value: "verified", label: "Verified" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load stores${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search
            ? `No stores match "${search}".`
            : "No stores found in records."
        }
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
