import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpadteCategoryStatusMutation,
} from "../../../features/category/categoryApi";
import type { Category } from "../../../features/category/categoryTypes";
import {
  countAll,
  LEVEL_LABEL,
  resolveImageUrl,
} from "../../../features/category/categoryHelpers";
import "../../../styles/category/CategoryList.css";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";

const PAGE_LIMIT = 10;

const ImageIcon = () => (
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

const CategoryList = () => {
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const navigate = useNavigate();

  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Categories",
    });
  }, [setHeaderConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCategoriesQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      level: levelFilter === "all" ? undefined : levelFilter,
    });

  const [updateCategoryStatus] = useUpadteCategoryStatusMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const categories = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = useMemo(() => countAll(categories), [categories]);

  const handleToggleStatus = async (category: Category) => {
    setUpdatingId(category._id);
    try {
      await updateCategoryStatus(category._id).unwrap();
    } catch (err) {
      console.error("Failed to update category status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    const categoryName = selectedCategory.name;
    try {
      await deleteCategory(selectedCategory._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
      toast.success("Category deleted", {
        description: `"${categoryName}" has been successfully removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete category", {
        description: errMsg,
      });
    }
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: "name",
      header: "Category",
      isPrimary: true,
      render: (category) => {
        const imageUrl = resolveImageUrl(category.category_image);
        return (
          <>
            <span className="cl-thumb">
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
              <span className={`cl-thumb-fallback ${imageUrl ? "d-none" : ""}`}>
                <ImageIcon />
              </span>
            </span>
            <span className="cl-name-text">
              <span className="cl-name">{category.name}</span>
              <span className="cl-level-tag cl-level-tag--inline d-md-none">
                {LEVEL_LABEL[category.level] ?? `L${category.level}`}
              </span>
            </span>
          </>
        );
      },
    },
    {
      key: "level",
      header: "Level",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (category) => (
        <span className={`cl-level-tag cl-level-tag--${category.level}`}>
          {LEVEL_LABEL[category.level] ?? `L${category.level}`}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (category) => (
        <span className="cl-desc-text" title={category.description}>
          {category.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (category) => (
        <DataTableStatusToggle
          active={category.status === "active"}
          isUpdating={updatingId === category._id}
          onChange={() => handleToggleStatus(category)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (category) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => navigate(`/admin/categories/${category?._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(category)}
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
          { label: `${pagination?.total ?? stats.total} total`, navy: true },
          ...Object.entries(stats.byLevel)
            .filter(([, count]) => count > 0)
            .map(([level, count]) => ({
              label: `${count} ${LEVEL_LABEL[Number(level)] ?? `Level ${level}`}${levelFilter === "all" && !search ? " · this page" : ""}`,
            })),
        ]}
        columns={columns}
        data={categories}
        getId={(c) => c._id}
        getChildren={(c) => c.children}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search categories..."
        filters={[
          {
            value: String(levelFilter),
            onChange: (v) => {
              setLevelFilter(v === "all" ? "all" : Number(v));
              setPage(1);
            },
            options: [
              { value: "all", label: "All levels" },
              { value: "1", label: "Level 1 (Main)" },
              { value: "2", label: "Level 2 (Sub-category)" },
              { value: "3", label: "Level 3 (Service)" },
              { value: "4", label: "Level 4 (Sub-service)" },
            ],
          },
        ]}
        addButtonLabel="Add Category"
        onAddClick={() => navigate("/admin/categories/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load categories${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No categories match "${search}".` : "No categories yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Category"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedCategory?.name}"</strong>? All associated
            sub-categories or items under it might be affected.
          </>
        }
      />
    </>
  );
};

export default CategoryList;
