// src/pages/admin/vendor/VendorList.tsx

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LuPhone, LuMail } from "react-icons/lu";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  useFetchVendorsQuery,
  useUpdateVendorStatusMutation,
  useUpdateVendorVerificationMutation,
  useDeleteVendorMutation,
} from "../../../features/vendor/vendorApi";
import type { Vendor } from "../../../features/vendor/vendorTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/vendor/vendorList.css";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";

const PAGE_LIMIT = 10;
const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

export default function VendorList(): React.ReactElement {
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingVerify, setUpdatingVerify] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    setHeaderConfig({
      title: "Vendors Management",
      subtitle:
        "View and manage vendors, verification status, availability, and categories",
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
    useFetchVendorsQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter !== "all" ? Number(statusFilter) : undefined,
      isVendorVerified:
        verifiedFilter !== "all" ? verifiedFilter === "true" : undefined,

      category: categoryFilter || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  const [updateVendorStatus] = useUpdateVendorStatusMutation();
  const [updateVendorVerification] = useUpdateVendorVerificationMutation();

  const rawVendors = data?.data ?? [];
  const pagination = data?.pagination;

  const vendors = useMemo(() => {
    if (!search) return rawVendors;
    const lower = search.toLowerCase();
    return rawVendors.filter(
      (v) =>
        v.fullName?.toLowerCase().includes(lower) ||
        v.email?.toLowerCase().includes(lower) ||
        v.phone?.toLowerCase().includes(lower) ||
        v.code?.toLowerCase().includes(lower) ||
        v.vendorCategories?.some((c) => c.toLowerCase().includes(lower)),
    );
  }, [rawVendors, search]);

  const stats = useMemo(() => {
    const active = vendors.filter((v) => v.status === 1).length;
    const inactive = vendors.filter((v) => v.status === 0).length;
    const verified = vendors.filter((v) => v.isVendorVerified).length;
    return {
      active,
      inactive,
      verified,
      total: pagination?.total ?? vendors.length,
    };
  }, [vendors, pagination]);

  const handleToggleStatus = async (vendor: Vendor) => {
    const newStatus = vendor.status === 1 ? 0 : 1;
    setUpdatingStatus(vendor._id);
    try {
      await updateVendorStatus({
        userId: vendor._id,
        payload: { status: newStatus },
      }).unwrap();
      toast.success("Status updated", {
        description: `"${vendor.fullName || "Vendor"}" is now ${
          newStatus === 1 ? "Active" : "Inactive"
        }.`,
      });
    } catch (err: any) {
      toast.error("Failed to update status", {
        description:
          err?.data?.message ?? "Could not update status. Please try again.",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleToggleVerification = async (vendor: Vendor) => {
    const newValue = !vendor.isVendorVerified;
    setUpdatingVerify(vendor._id);
    try {
      await updateVendorVerification({
        userId: vendor._id,
        payload: { isVendorVerified: newValue },
      }).unwrap();
      toast.success("Verification updated", {
        description: `"${vendor.fullName || "Vendor"}" is now ${
          newValue ? "Verified" : "Unverified"
        }.`,
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

  const openDeleteModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVendor) return;
    const vendorName = selectedVendor.fullName;
    try {
      await deleteVendor(selectedVendor._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedVendor(null);
      toast.success("Vendor deleted", {
        description: `"${vendorName}" has been successfully removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete vendor:", error);
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete vendor", {
        description: errMsg,
      });
    }
  };

  const getInitials = (name?: string): string => {
    if (!name?.trim()) return "V";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (
      words[0].charAt(0).toUpperCase() +
      words[words.length - 1].charAt(0).toUpperCase()
    );
  };

  const columns: DataTableColumn<Vendor>[] = [
    {
      key: "fullName",
      header: "Vendor",
      isPrimary: true,
      render: (vendor) => (
        <div className="vendor-table-profile">
          <div className="vendor-table-avatar">
            {vendor.profilePicture ? (
              <img
                src={`${ASSET_URL}${vendor.profilePicture}`}
                alt={vendor.fullName || "Vendor"}
                className="vendor-table-avatar-img"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (
                    e.currentTarget.nextElementSibling as HTMLElement
                  ).style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="vendor-table-avatar-initials"
              style={{ display: vendor.profilePicture ? "none" : "flex" }}
            >
              {getInitials(vendor.fullName)}
            </span>
          </div>
          <div className="vendor-table-name-wrapper">
            <span className="vendor-table-name">{vendor.fullName || "—"}</span>

            <span className="vendor-table-subtext d-md-none">
              {vendor.email || vendor.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (vendor) => (
        <span className="vendor-table-contact-text">
          <LuMail size={14} className="vendor-table-icon" />
          <span>{vendor.email || "—"}</span>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (vendor) => (
        <span className="vendor-table-contact-text">
          <LuPhone size={14} className="vendor-table-icon" />
          <span>{vendor.phone || "—"}</span>
        </span>
      ),
    },
    {
      key: "isVendorVerified",
      header: "Verified",
      render: (vendor) => (
        <div className="vendor-table-toggle-wrapper">
          <DataTableStatusToggle
            active={vendor.isVendorVerified}
            isUpdating={updatingVerify === vendor.user_id}
            onChange={() => handleToggleVerification(vendor)}
            activeLabel="Verified"
            inactiveLabel="Unverified"
          />
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (vendor) => (
        <div className="vendor-table-toggle-wrapper">
          <DataTableStatusToggle
            active={vendor.status === 1}
            isUpdating={updatingStatus === vendor._id}
            onChange={() => handleToggleStatus(vendor)}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (vendor) => (
        <div className="vendor-table-actions">
          <button
            type="button"
            className="vendor-table-action-btn"
            title="Edit Vendor"
            onClick={() => navigate(`/admin/vendors/${vendor._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(vendor)}
          >
            <MdDelete color="red" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="vendor-list-page">
      <DataTable
        statPills={[
          { label: `${stats.total} total vendors`, navy: true },
          { label: `${stats.active} active · this page` },
          { label: `${stats.inactive} inactive · this page` },
          { label: `${stats.verified} verified · this page` },
        ]}
        columns={columns}
        data={vendors}
        getId={(v) => v._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name or email..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Status" },
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ],
          },
          {
            value: verifiedFilter,
            onChange: (v) => {
              setVerifiedFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Vendors" },
              { value: "true", label: "Verified" },
              { value: "false", label: "Unverified" },
            ],
          },
        ]}
        addButtonLabel="Add Vendor"
        onAddClick={() => navigate("/admin/vendors/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load vendors${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search
            ? `No vendors match "${search}".`
            : "No vendors found in records."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedVendor(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Vendor"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedVendor?.fullName}"</strong>?
          </>
        }
      />
    </div>
  );
}
