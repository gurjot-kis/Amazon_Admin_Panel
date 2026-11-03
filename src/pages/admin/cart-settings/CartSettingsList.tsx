import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetCartSettingsQuery,
  useToggleCartSettingsStatusMutation,
  useDeleteCartSettingsMutation,
} from "../../../features/cart/cartSettingsApi";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { useHeader } from "../../../layout/LayoutContext";
import { MdDelete, MdModeEdit } from "react-icons/md";
import "../../../styles/cart/cart-settings.css";

const PAGE_LIMIT = 10;

// Currency format helper
const formatCurrency = (val?: number | string) => {
  const num = Number(val ?? 0);
  return `₹${num.toLocaleString("en-IN")}`;
};

const CartSettingsList = () => {
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any | null>(null);

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Cart Settings" });
  }, [setHeaderConfig]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCartSettingsQuery({ page, limit: PAGE_LIMIT });

  const [toggleStatus] = useToggleCartSettingsStatusMutation();
  const [deleteCartSettings, { isLoading: isDeleting }] =
    useDeleteCartSettingsMutation();

  const settings = data?.data ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total ?? settings.length;
    const enabled = settings.filter(
      (s: any) => (s.is_active ?? s.status ?? s.enabled) === "active",
    ).length;
    return { total, enabled };
  }, [settings, pagination]);

  const handleToggleStatus = async (setting: any) => {
    setUpdatingId(setting._id);
    const currentActiveState =
      (setting.is_active ?? setting.status ?? setting.enabled) === "active";
    try {
      await toggleStatus(setting._id).unwrap();
      toast.success(
        currentActiveState ? "Cart setting disabled" : "Cart setting enabled",
      );
    } catch (err: any) {
      toast.error("Failed to update status", {
        description:
          err?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (setting: any) => {
    setSelectedSetting(setting);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSetting) return;
    try {
      await deleteCartSettings(selectedSetting._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedSetting(null);
      toast.success("Cart settings deleted", {
        description: "Configuration has been removed successfully.",
      });
    } catch (err: any) {
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete", { description: errMsg });
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "handling_charge",
      header: "Handling Charge",
      render: (s) => formatCurrency(s.handling_charge),
    },
    {
      key: "delivery_charge",
      header: "Delivery Charge",
      render: (s) => formatCurrency(s.delivery_charge),
    },
    {
      key: "free_delivery_min_amount",
      header: "Free Delivery Min",
      render: (s) => formatCurrency(s.free_delivery_min_amount),
    },
    {
      key: "small_cart_charge",
      header: "Small Cart Charge",
      render: (s) => (
        <span>
          {formatCurrency(s.small_cart_charge)}{" "}
          <small style={{ color: "#94a3b8" }}>
            (up to {formatCurrency(s.small_cart_max_amount)})
          </small>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => {
        const isActive = (s.is_active ?? s.status ?? s.enabled) === "active";
        return (
          <DataTableStatusToggle
            active={isActive}
            isUpdating={updatingId === s._id}
            onChange={() => handleToggleStatus(s)}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (s) => (
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            type="button"
            className="cs-action-btn"
            title="Edit configuration"
            style={{
              padding: "6px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              background: "#fff",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/admin/cart-settings/${s._id}/edit`)}
          >
            <MdModeEdit size={16} color="#3b82f6" />
          </button>
          <button
            type="button"
            className="cs-action-btn"
            title="Delete setting"
            style={{
              padding: "6px",
              border: "1px solid #fee2e2",
              borderRadius: "6px",
              background: "#fff",
              cursor: "pointer",
            }}
            onClick={() => openDeleteModal(s)}
          >
            <MdDelete size={16} color="#ef4444" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        statPills={[
          { label: `${stats.total} Total Configs`, navy: true },
          ...(stats.enabled > 0 ? [{ label: `${stats.enabled} Active` }] : []),
        ]}
        columns={columns}
        data={settings}
        getId={(s) => s._id}
        addButtonLabel="Add Cart Setting"
        onAddClick={() => navigate("/admin/cart-settings/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load cart settings${
          error && "status" in error ? ` (${(error as any).status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage="No cart settings found."
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSetting(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Cart Setting"
        message="Are you sure you want to delete this cart setting? This action cannot be undone."
      />
    </>
  );
};

export default CartSettingsList;
