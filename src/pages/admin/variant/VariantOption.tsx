import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteVariantOptionMutation,
  useGetVariantOptionsQuery,
  useGetVariantTypesQuery,
  useUpdateVariantOptionStatusMutation,
} from "../../../features/variant/variantApi";
import type { VariantOption } from "../../../features/variant/variantTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { useHeader } from "../../../layout/LayoutContext";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit } from "react-icons/md";
import "../../../styles/variant/VariantOptionList.css";

const PAGE_LIMIT = 10;
const META_VISIBLE_LIMIT = 3;

const hexToReadable = (hex: string): string => {
  const full =
    hex.length === 3
      ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.75 ? "#334155" : `#${hex}`;
};

const MetaCell = ({ meta }: { meta: Record<string, string> }) => {
  const entries = Object.entries(meta ?? {});
  if (!entries.length) return <span style={{ color: "#94a3b8" }}>—</span>;

  const visible = entries.slice(0, META_VISIBLE_LIMIT);
  const overflow = entries.length - META_VISIBLE_LIMIT;
  const fullText = entries.map(([k, v]) => `${k}: ${v}`).join("  |  ");

  return (
    <div className="vo-meta-list" title={fullText}>
      {visible.map(([key, val]) =>
        key === "hex" ? (
          <span key={key} className="vo-meta-color">
            <span className="vo-color-swatch-wrap">
              <span
                className="vo-color-swatch"
                style={{ background: `#${val}` }}
              />
            </span>
            <span className="vo-meta-key">{key}:</span>
            <span className="vo-meta-hex" style={{ color: hexToReadable(val) }}>
              {val}
            </span>
          </span>
        ) : (
          <span key={key} className="vo-meta-badge">
            <span className="vo-meta-key">{key}:</span>
            <span className="vo-meta-val">{val}</span>
          </span>
        ),
      )}
      {overflow > 0 && <span className="vo-meta-more">+{overflow}</span>}
    </div>
  );
};

/* ── component ─────────────────────────────────────────── */
const VariantOptionList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [variantTypeFilter, setVariantTypeFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<VariantOption | null>(
    null,
  );

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Variant Options" });
  }, [setHeaderConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: variantTypesData } = useGetVariantTypesQuery({ limit: 100 });

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetVariantOptionsQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      variant_type_id:
        variantTypeFilter === "all" ? undefined : variantTypeFilter,
    });

  const [updateVariantOptionStatus] = useUpdateVariantOptionStatusMutation();
  const [deleteVariantOption, { isLoading: isDeleting }] =
    useDeleteVariantOptionMutation();

  const variantOptions = data?.data ?? [];
  const pagination = data?.pagination;

  const totalActive = useMemo(
    () => variantOptions.filter((v) => v.status === "active").length,
    [variantOptions],
  );
  const totalInactive = useMemo(
    () => variantOptions.filter((v) => v.status === "inactive").length,
    [variantOptions],
  );

  const variantTypeFilterOptions = useMemo(() => {
    const types = variantTypesData?.data ?? [];
    return [
      { value: "all", label: "All types" },
      ...types.map((t) => ({ value: t._id, label: t.name })),
    ];
  }, [variantTypesData]);

  const handleToggleStatus = async (option: VariantOption) => {
    setUpdatingId(option._id);
    try {
      await updateVariantOptionStatus(option._id).unwrap();
    } catch (err) {
      console.error("Failed to update variant option status:", err);
      toast.error("Failed to update status", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (option: VariantOption) => {
    setSelectedOption(option);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOption) return;
    const label = selectedOption.label || selectedOption.value;
    try {
      await deleteVariantOption(selectedOption._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedOption(null);
      toast.success("Variant option deleted", {
        description: `"${label}" has been successfully removed.`,
      });
    } catch (err: any) {
      console.error("Failed to delete variant option:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete variant option", { description: errMsg });
    }
  };

  const columns: DataTableColumn<VariantOption>[] = [
    {
      key: "label",
      header: "Option",
      isPrimary: true,
      render: (opt) => {
        const isColorType = opt.variant_type_id?.slug === "color";
        return (
          <span className="vo-option-cell">
            {isColorType && (
              <span className="vo-color-swatch-wrap vo-color-swatch-wrap--lg">
                <span
                  className="vo-color-swatch"
                  style={{ background: opt.value }}
                />
              </span>
            )}
            <span className="vo-label-text">{opt.label || opt.value}</span>
          </span>
        );
      },
    },
    {
      key: "variant_type_id",
      header: "Type",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (opt) => (
        <span className="cl-level-tag cl-level-tag--1">
          {opt.variant_type_id?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "meta",
      header: "Meta",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (opt) => <MetaCell meta={opt.meta} />,
    },
    {
      key: "status",
      header: "Status",
      render: (opt) => (
        <DataTableStatusToggle
          active={opt.status === "active"}
          isUpdating={updatingId === opt._id}
          onChange={() => handleToggleStatus(opt)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (opt) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => navigate(`/admin/variant-option/${opt._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(opt)}
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
            label: `${pagination?.total ?? variantOptions.length} total`,
            navy: true,
          },
          ...(totalActive > 0
            ? [
                {
                  label: `${totalActive} active${
                    statusFilter === "all" && !search ? " · this page" : ""
                  }`,
                },
              ]
            : []),
          ...(totalInactive > 0
            ? [
                {
                  label: `${totalInactive} inactive${
                    statusFilter === "all" && !search ? " · this page" : ""
                  }`,
                },
              ]
            : []),
        ]}
        columns={columns}
        data={variantOptions}
        getId={(opt) => opt._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search variant options..."
        filters={[
          {
            value: variantTypeFilter,
            onChange: (v) => {
              setVariantTypeFilter(v);
              setPage(1);
            },
            options: variantTypeFilterOptions,
          },
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
        addButtonLabel="Add Option"
        onAddClick={() => navigate("/admin/variant-option/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load variant options${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search
            ? `No variant options match "${search}".`
            : "No variant options yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedOption(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Variant Option"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedOption?.label || selectedOption?.value}"</strong>?
            This may affect products using this option.
          </>
        }
      />
    </>
  );
};

export default VariantOptionList;
