import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useGetWalletSettingsQuery,
  useDeleteWalletSettingsMutation,
  useToggleWalletSettingsStatusMutation,
  useSetDefaultWalletSettingsMutation,
} from "../../../features/wallet/walletSettingsApi";
import type { WalletSettings } from "../../../features/wallet/walletSettingsTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { useHeader } from "../../../layout/LayoutContext";
import { useNavigate } from "react-router-dom";
import {
  MdDelete,
  MdModeEdit,
  MdStar,
  MdStarBorder,
  MdArrowForward,
} from "react-icons/md";
import "../../../styles/wallet/WalletSettingsList.css";

const isDefault = (s: WalletSettings) => s.key === "default";
const PAGE_LIMIT = 10;

// Helper: Convert paise from API to Rupees and format as currency
const paiseToRupees = (paise: number) => paise / 100;
const formatPaiseAsRupees = (paise: number) =>
  `₹${paiseToRupees(paise).toLocaleString("en-IN")}`;

const WalletSettingsList = () => {
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<WalletSettings | null>(
    null,
  );

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Wallet Settings" });
  }, [setHeaderConfig]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetWalletSettingsQuery({ page, limit: PAGE_LIMIT });

  const [toggleStatus] = useToggleWalletSettingsStatusMutation();
  const [setDefault] = useSetDefaultWalletSettingsMutation();
  const [deleteWalletSettings, { isLoading: isDeleting }] =
    useDeleteWalletSettingsMutation();

  const settings = data?.data ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total ?? settings.length;
    const enabled = settings.filter((s) => s.enabled).length;
    return { total, enabled };
  }, [settings, pagination]);

  const handleToggleStatus = async (setting: WalletSettings) => {
    setUpdatingId(setting._id);
    try {
      await toggleStatus(setting._id).unwrap();
      toast.success(setting.enabled ? "Setting disabled" : "Setting enabled");
    } catch {
      toast.error("Failed to update status", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetDefault = async (s: WalletSettings) => {
    if (isDefault(s) || settingDefaultId === s._id) return;
    setSettingDefaultId(s._id);
    try {
      await setDefault(s._id).unwrap();
      toast.success("Default updated successfully");
    } catch (err: any) {
      toast.error("Failed to set default", {
        description: err?.data?.message || "Something went wrong.",
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const openDeleteModal = (setting: WalletSettings) => {
    setSelectedSetting(setting);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSetting) return;
    const keyName = selectedSetting.key;
    try {
      await deleteWalletSettings(selectedSetting._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedSetting(null);
      toast.success("Wallet setting deleted", {
        description: `"${keyName}" has been successfully removed.`,
      });
    } catch (err: any) {
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete", { description: errMsg });
    }
  };

  const columns: DataTableColumn<WalletSettings>[] = [
    {
      key: "key" as any,
      header: "Configuration",
      isPrimary: true,
      render: (s, index) => {
        const isDef = isDefault(s);
        return (
          <div className="ws-config-cell">
            <div className="ws-config-title">
              <span className="ws-key-badge">
                {isDef
                  ? "Default Configuration"
                  : `Wallet Profile #${index + 1}`}
              </span>
              {isDefault(s) ? (
                <span
                  className="ws-badge ws-badge--default"
                  title="Active default wallet configuration"
                >
                  <MdStar className="ws-badge-icon" /> Default
                </span>
              ) : (
                <button
                  type="button"
                  className="ws-make-default-btn"
                  disabled={settingDefaultId === s._id}
                  onClick={() => handleSetDefault(s)}
                  title="Click to set as default"
                >
                  {settingDefaultId === s._id ? (
                    <span className="ws-mini-spinner" />
                  ) : (
                    <>
                      <MdStarBorder /> Set default
                    </>
                  )}
                </button>
              )}
            </div>
            <span className="ws-subtext">ID: {s._id.slice(-8)}</span>
          </div>
        );
      },
    },
    {
      key: "min_topup",
      header: "Top-up Range",
      render: (s) => (
        <div className="ws-range-card">
          <span className="ws-range-min">
            {formatPaiseAsRupees(s.min_topup)}
          </span>
          <MdArrowForward className="ws-range-arrow" />
          <span className="ws-range-max">
            {formatPaiseAsRupees(s.max_topup)}
          </span>
        </div>
      ),
    },
    {
      key: "max_balance",
      header: "Max Balance",
      render: (s) => (
        <div className="ws-balance-cell">
          <span className="ws-balance-amount">
            {formatPaiseAsRupees(s.max_balance)}
          </span>
          <span className="ws-cap-label">Wallet Cap</span>
        </div>
      ),
    },
    {
      key: "quick_topup_amounts",
      header: "Quick Preset Amounts",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (s) =>
        s.quick_topup_amounts && s.quick_topup_amounts.length > 0 ? (
          <div className="ws-quick-amounts">
            {s.quick_topup_amounts.map((amtInPaise) => (
              <span key={amtInPaise} className="ws-quick-chip">
                {formatPaiseAsRupees(amtInPaise)}
              </span>
            ))}
          </div>
        ) : (
          <span className="ws-muted">—</span>
        ),
    },
    {
      key: "enabled",
      header: "Status",
      render: (s) => (
        <DataTableStatusToggle
          active={s.enabled}
          isUpdating={updatingId === s._id}
          onChange={() => handleToggleStatus(s)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (s) => {
        const isDef = isDefault(s);
        return (
          <div className="ws-actions">
            <button
              type="button"
              className="ws-action-btn ws-action-btn--edit"
              title="Edit configuration"
              onClick={() => navigate(`/admin/wallet-settings/${s._id}/edit`)}
            >
              <MdModeEdit size={16} />
            </button>
            <button
              type="button"
              className={`ws-action-btn ws-action-btn--delete ${
                isDef ? "ws-action-btn--disabled" : ""
              }`}
              title={
                isDef
                  ? "Default configuration cannot be deleted"
                  : "Delete setting"
              }
              disabled={isDef}
              onClick={() => openDeleteModal(s)}
            >
              <MdDelete size={16} />
            </button>
          </div>
        );
      },
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
        addButtonLabel="Add Wallet Setting"
        onAddClick={() => navigate("/admin/wallet-settings/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load wallet settings${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage="No wallet settings yet."
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
        title="Delete Wallet Setting"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedSetting?.key}"</strong>? This action cannot be
            undone.
          </>
        }
      />
    </>
  );
};

export default WalletSettingsList;
