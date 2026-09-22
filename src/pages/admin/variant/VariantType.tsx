import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteVariantTypeMutation,
  useGetVariantTypesQuery,
  useUpdateVariantTypeStatusMutation,
} from "../../../features/variant/variantApi";
import type { VariantType } from "../../../features/variant/variantTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { useHeader } from "../../../layout/LayoutContext";
// import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit } from "react-icons/md";
import VariantTypeFormModal from "./VariantTypeFormModal";

const PAGE_LIMIT = 10;

const VariantTypeList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVariantType, setSelectedVariantType] =
    useState<VariantType | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pick<
    VariantType,
    "_id" | "name"
  > | null>(null);

//   const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Variant Types" });
  }, [setHeaderConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetVariantTypesQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  const [updateVariantTypeStatus] = useUpdateVariantTypeStatusMutation();
  const [deleteVariantType, { isLoading: isDeleting }] =
    useDeleteVariantTypeMutation();

  const variantTypes = data?.data ?? [];
  const pagination = data?.pagination;

  const totalActive = useMemo(
    () => variantTypes.filter((v) => v.status === "active").length,
    [variantTypes],
  );
  const totalInactive = useMemo(
    () => variantTypes.filter((v) => v.status === "inactive").length,
    [variantTypes],
  );

  const handleToggleStatus = async (variantType: VariantType) => {
    setUpdatingId(variantType._id);
    try {
      await updateVariantTypeStatus(variantType._id).unwrap();
    } catch (err) {
      console.error("Failed to update variant type status:", err);
      toast.error("Failed to update status", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (variantType: VariantType) => {
    setSelectedVariantType(variantType);
    setIsDeleteModalOpen(true);
  };

  const openAddModal = () => {
    setEditTarget(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (vt: VariantType) => {
    setEditTarget({ _id: vt._id, name: vt.name });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVariantType) return;
    const name = selectedVariantType.name;
    try {
      await deleteVariantType(selectedVariantType._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedVariantType(null);
      toast.success("Variant type deleted", {
        description: `"${name}" has been successfully removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete variant type:", error);
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete variant type", { description: errMsg });
    }
  };

  const columns: DataTableColumn<VariantType>[] = [
    {
      key: "name",
      header: "Name",
      isPrimary: true,
      render: (vt) => <span>{vt.name}</span>,
    },

    {
      key: "status",
      header: "Status",
      render: (vt) => (
        <DataTableStatusToggle
          active={vt.status === "active"}
          isUpdating={updatingId === vt._id}
          onChange={() => handleToggleStatus(vt)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (vt) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => openEditModal(vt)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(vt)}
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
            label: `${pagination?.total ?? variantTypes.length} total`,
            navy: true,
          },
          ...(totalActive > 0
            ? [
                {
                  label: `${totalActive} active${statusFilter === "all" && !search ? " · this page" : ""}`,
                },
              ]
            : []),
          ...(totalInactive > 0
            ? [
                {
                  label: `${totalInactive} inactive${statusFilter === "all" && !search ? " · this page" : ""}`,
                },
              ]
            : []),
        ]}
        columns={columns}
        data={variantTypes}
        getId={(vt) => vt._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search variant types..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v as "all" | "active" | "inactive");
              setPage(1);
            },
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        addButtonLabel="Add Variant Type"
        onAddClick={openAddModal}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load variant types${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search
            ? `No variant types match "${search}".`
            : "No variant types yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedVariantType(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Variant Type"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedVariantType?.name}"</strong>? This may affect
            associated variants or items.
          </>
        }
      />

      <VariantTypeFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        editTarget={editTarget}
      />
    </>
  );
};

export default VariantTypeList;
