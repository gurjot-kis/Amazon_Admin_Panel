import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit } from "react-icons/md";
import {
  useDeleteCartSettingsMutation,
  useGetCartSettingsQuery,
} from "../../../features/cart/cartSettingsApi";
import type { CartSettings } from "../../../features/cart/cartSettingsTypes";
import { DataTable } from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { useHeader } from "../../../layout/LayoutContext";

const PAGE_LIMIT = 10;

const formatAmount = (value?: number | null): string =>
  `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const CartSettingsList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [knownRoles, setKnownRoles] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartSettings | null>(null);

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Cart Settings" });
  }, [setHeaderConfig]);

  // debounce search (search is applied as user_id filter)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCartSettingsQuery({
      page,
      limit: PAGE_LIMIT,
      user_id: search || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
    });

  const [deleteCartSettings, { isLoading: isDeleting }] =
    useDeleteCartSettingsMutation();

  const cartSettings = data?.data ?? [];
  const pagination = data?.pagination;

  // Accumulate roles seen so far so the role dropdown doesn't collapse
  // to a single option once a role filter is applied.
  useEffect(() => {
    if (!cartSettings.length) return;
    setKnownRoles((prev) => {
      const next = new Set(prev);
      cartSettings.forEach((c) => c.role && next.add(c.role));
      return next.size === prev.length ? prev : Array.from(next).sort();
    });
  }, [cartSettings]);

  const roleFilterOptions = useMemo(
    () => [
      { value: "all", label: "All roles" },
      ...knownRoles.map((r) => ({ value: r, label: r })),
    ],
    [knownRoles],
  );

  const openDeleteModal = (item: CartSettings) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    const label = selectedItem.role || selectedItem.cart_settings_id;
    try {
      await deleteCartSettings(selectedItem._id).unwrap();
      closeDeleteModal();
      toast.success("Cart settings deleted", {
        description: `Settings for "${label}" have been successfully removed.`,
      });
    } catch (err: any) {
      console.error("Failed to delete cart settings:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete cart settings", { description: errMsg });
    }
  };

  const columns: DataTableColumn<CartSettings>[] = [
    {
      key: "role",
      header: "Role",
      isPrimary: true,
      render: (item) => (
        <span className="cl-level-tag cl-level-tag--1">{item.role || "—"}</span>
      ),
    },
    {
      key: "user_id",
      header: "User ID",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (item) => (
        <span title={item.user_id || undefined}>{item.user_id || "—"}</span>
      ),
    },
    {
      key: "handling_charge",
      header: "Handling",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (item) => formatAmount(item.handling_charge),
    },
    {
      key: "delivery_charge",
      header: "Delivery",
      render: (item) => formatAmount(item.delivery_charge),
    },
    {
      key: "free_delivery_min_amount",
      header: "Free Delivery Above",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (item) => formatAmount(item.free_delivery_min_amount),
    },
    {
      key: "small_cart_charge",
      header: "Small Cart Charge",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (item) => formatAmount(item.small_cart_charge),
    },
    {
      key: "small_cart_max_amount",
      header: "Small Cart Below",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (item) => formatAmount(item.small_cart_max_amount),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (item) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => navigate(`/admin/cart-settings/${item._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
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
            label: `${pagination?.total ?? cartSettings.length} total`,
            navy: true,
          },
        ]}
        columns={columns}
        data={cartSettings}
        getId={(item) => item._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by user ID..."
        filters={[
          {
            value: roleFilter,
            onChange: (v) => {
              setRoleFilter(v);
              setPage(1);
            },
            options: roleFilterOptions,
          },
        ]}
        addButtonLabel="Add Cart Settings"
        onAddClick={() => navigate("/admin/cart-settings/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load cart settings${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search || roleFilter !== "all"
            ? "No cart settings match your filters."
            : "No cart settings yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Cart Settings"
        message={
          <>
            Are you sure you want to delete the cart settings for{" "}
            <strong>
              "{selectedItem?.role || selectedItem?.cart_settings_id}"
            </strong>
            ? This action cannot be undone.
          </>
        }
      />
    </>
  );
};

export default CartSettingsList;
