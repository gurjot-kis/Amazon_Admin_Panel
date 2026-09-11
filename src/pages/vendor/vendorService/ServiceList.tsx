import { useEffect, useState } from "react";
import {
  useDeleteVendorServiceMutation,
  useGetVendorServicesQuery,
  useToggleVendorServiceMutation,
} from "../../../features/vendor/vendorApi";
import type { VendorService } from "../../../features/vendor/vendorTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";
import { MdDelete } from "react-icons/md";
import "../../../styles/vendor/VendorServiceList.css";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";

const PAGE_LIMIT = 10;

const ServiceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="8.5" cy="8.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M21 15l-5-5-9 9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ServiceList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">(
    "",
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<VendorService | null>(
    null,
  );

  const { setHeaderConfig } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setHeaderConfig({ title: "Vendor Services" });
  }, [setHeaderConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetVendorServicesQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter || undefined,
    });

  const [toggleVendorService] = useToggleVendorServiceMutation();
  const [deleteVendorService, { isLoading: isDeleting }] =
    useDeleteVendorServiceMutation();

  const services = data?.data ?? [];
  const pagination = data?.pagination;

  const handleToggleStatus = async (item: VendorService) => {
    setUpdatingId(item._id);
    try {
      await toggleVendorService(item._id).unwrap();
      const newStatus = item.status === "active" ? "inactive" : "active";
      toast.success("Status updated", {
        description: `"${item.service?.name}" is now ${newStatus}.`,
      });
    } catch (err) {
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to update status", { description: errMsg });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (item: VendorService) => {
    setSelectedService(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedService) return;
    const serviceName = selectedService.service?.name ?? "Service";
    try {
      await deleteVendorService(selectedService._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedService(null);
      toast.success("Service deleted", {
        description: `"${serviceName}" has been successfully removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete service:", error);
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete service", {
        description: errMsg,
      });
    }
  };

  const columns: DataTableColumn<VendorService>[] = [
    {
      key: "service",
      header: "Service",
      isPrimary: true,
      render: (item) => {
        const imageUrl = item.service?.category_image
          ? `${import.meta.env.VITE_API_ASSET_URL}${item.service.category_image}`
          : null;
        return (
          <>
            <span className="vs-thumb">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "d-none",
                    );
                  }}
                />
              ) : null}
              <span className={`vs-thumb-fallback ${imageUrl ? "d-none" : ""}`}>
                <ServiceIcon />
              </span>
            </span>
            <span className="vs-name">{item.service?.name ?? "—"}</span>
          </>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (item) => {
        const imageUrl = item.category?.category_image
          ? `${import.meta.env.VITE_API_ASSET_URL}${item.category.category_image}`
          : null;
        return (
          <>
            <span className="vs-thumb">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "d-none",
                    );
                  }}
                />
              ) : null}
              <span className={`vs-thumb-fallback ${imageUrl ? "d-none" : ""}`}>
                <ServiceIcon />
              </span>
            </span>
            <span className="vs-name">{item.category?.name ?? "—"}</span>
          </>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <DataTableStatusToggle
          active={item.status === "active"}
          isUpdating={updatingId === item._id}
          onChange={() => handleToggleStatus(item)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (item) => (
        <div className="vs-actions">
          <button
            type="button"
            className="vs-icon-btn vs-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(item)}
          >
            <MdDelete color="red" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        statPills={[
          {
            label: `${pagination?.total ?? services.length} total`,
            navy: true,
          },
          {
            label: `${services.filter((s) => s.status === "active").length} active · this page`,
          },
          {
            label: `${services.filter((s) => s.status === "inactive").length} inactive · this page`,
          },
        ]}
        columns={columns}
        data={services}
        getId={(s) => s._id}
        addButtonLabel="Add Service"
        onAddClick={() => navigate("/vendor/services/add")}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search services..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v as "active" | "inactive" | "");
              setPage(1);
            },
            options: [
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load services${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No services match "${search}".` : "No services yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedService(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Service"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedService?.service?.name}"</strong>? This action
            cannot be undone.
          </>
        }
      />
    </>
  );
};

export default ServiceList;
