import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  useDeleteProductMutation,
  useFetchProductsQuery,
  useUpdateProductStatusMutation,
} from "../../../features/product/productApi";
import type {
  Product,
  ProductStatus,
} from "../../../features/product/productTypes";
import {
  priceRangeLabel,
  resolveImageUrl,
} from "../../../features/product/productHelpers";
import "../../../styles/product/ProductList.css";
import { MdDelete, MdModeEdit, MdOutlineVisibility } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { DataTable } from "../../../components/common/DataTable/DataTable";
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

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; dotColor: string }
> = {
  active: { label: "Active", dotColor: "#10b981" },
  pending: { label: "Pending", dotColor: "#f59e0b" },
  rejected: { label: "Rejected", dotColor: "#ef4444" },
};

interface ProductStatusSelectProps {
  status: ProductStatus;
  isUpdating?: boolean;
  onChange: (status: ProductStatus) => void;
}

const ProductStatusSelect = ({
  status,
  isUpdating,
  onChange,
}: ProductStatusSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards =
      spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setMenuCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      openUpwards,
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div
      className={`pl-status-dropdown ${
        isUpdating ? "pl-status-dropdown--busy" : ""
      }`}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={isUpdating}
        onClick={handleToggle}
        className={`pl-status-trigger pl-status-trigger--${status} ${
          isOpen ? "pl-status-trigger--open" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="pl-status-dot-pulse"
          style={{ backgroundColor: currentConfig.dotColor }}
        />
        <span className="pl-status-label">{currentConfig.label}</span>
        <svg
          className={`pl-status-chevron ${
            isOpen ? "pl-status-chevron--rotate" : ""
          }`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen &&
        menuCoords &&
        createPortal(
          <div
            ref={menuRef}
            className={`pl-status-menu ${
              menuCoords.openUpwards ? "pl-status-menu--up" : ""
            }`}
            style={{
              position: "fixed",
              top: menuCoords.openUpwards ? "auto" : `${menuCoords.top}px`,
              bottom: menuCoords.openUpwards
                ? `${window.innerHeight - menuCoords.top}px`
                : "auto",
              left: `${menuCoords.left}px`,
              zIndex: 999999,
            }}
            role="listbox"
          >
            {(Object.keys(STATUS_CONFIG) as ProductStatus[]).map((key) => {
              const item = STATUS_CONFIG[key];
              const isSelected = key === status;

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`pl-status-option ${
                    isSelected ? "pl-status-option--selected" : ""
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    onChange(key);
                  }}
                >
                  <span
                    className="pl-status-option-dot"
                    style={{ backgroundColor: item.dotColor }}
                  />
                  <span className="pl-status-option-text">{item.label}</span>
                  {isSelected && (
                    <svg
                      className="pl-status-check"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

const ProductList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const navigate = useNavigate();

  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Products",
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
    useFetchProductsQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
    });

  const [updateProductStatus] = useUpdateProductStatusMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = async (
    product: Product,
    newStatus: ProductStatus,
  ) => {
    if (newStatus === product.status) return;

    setUpdatingId(product._id);

    try {
      await updateProductStatus({
        id: product._id,
        status: newStatus,
      }).unwrap();

      toast.success("Status updated", {
        description: `"${product.name}" is now ${newStatus}.`,
      });
    } catch (err: any) {
      console.error("Failed to update product status:", err);

      toast.error("Failed to update status", {
        description:
          err?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    const productName = selectedProduct.name;
    try {
      await deleteProduct(selectedProduct._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      toast.success("Product deleted", {
        description: `"${productName}" has been successfully removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete product", { description: errMsg });
    }
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Product",
      isPrimary: true,
      render: (product) => {
        const imageUrl = resolveImageUrl(product.mainImage);
        return (
          <>
            <span className="pl-thumb">
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
              <span className={`pl-thumb-fallback ${imageUrl ? "d-none" : ""}`}>
                <ImageIcon />
              </span>
            </span>
            <span className="pl-name-text">
              <span className="pl-name" title={product.name}>
                {product.name}
              </span>
              <span
                className="pl-short-desc d-md-none"
                title={product.shortDescription}
              >
                {product.shortDescription}
              </span>
            </span>
          </>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (product) => (
        <span className="pl-price">{priceRangeLabel(product)}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (product) => {
        const categoryImage = resolveImageUrl(product.category?.category_image);
        return (
          <div className="pl-category">
            <span className="pl-category-thumb">
              {categoryImage ? (
                <img
                  src={categoryImage}
                  alt={product.category?.name || "Category"}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "d-none",
                    );
                  }}
                />
              ) : null}
              <span
                className={`pl-category-thumb-fallback ${categoryImage ? "d-none" : ""}`}
              >
                <ImageIcon />
              </span>
            </span>
            <span className="pl-category-name" title={product.category?.name}>
              {product.category?.name || "-"}
            </span>
          </div>
        );
      },
    },
    {
      key: "subCategory",
      header: "Sub Category",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (product) => {
        if (!product.subCategory) return <span className="pl-no-sub">—</span>;
        const subCategoryImage = resolveImageUrl(
          product.subCategory?.category_image,
        );
        return (
          <div className="pl-category">
            <span className="pl-category-thumb">
              {subCategoryImage ? (
                <img
                  src={subCategoryImage}
                  alt={product.subCategory.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "d-none",
                    );
                  }}
                />
              ) : null}
              <span
                className={`pl-category-thumb-fallback ${subCategoryImage ? "d-none" : ""}`}
              >
                <ImageIcon />
              </span>
            </span>
            <span className="pl-category-name" title={product.subCategory.name}>
              {product.subCategory.name}
            </span>
          </div>
        );
      },
    },

    {
      key: "rating",
      header: "Rating",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (product) => (
        <span className="pl-rating">
          <StarIcon />
          {product.rating.average.toFixed(2)}
          <span className="pl-rating-count">({product.rating.count})</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product) => (
        <ProductStatusSelect
          status={product.status}
          isUpdating={updatingId === product._id}
          onChange={(newStatus) => handleStatusChange(product, newStatus)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (product) => (
        <div className="pl-actions">
          <button
            type="button"
            className="pl-icon-btn"
            title="View details"
            onClick={() => navigate(`/admin/products/${product._id}/details`)}
          >
            <MdOutlineVisibility color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="pl-icon-btn"
            title="Edit"
            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="pl-icon-btn pl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(product)}
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
        // title="Products"
        statPills={[
          {
            label: `${pagination?.total ?? products.length} total`,
            navy: true,
          },
        ]}
        columns={columns}
        data={products}
        getId={(p) => p._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search products..."
        addButtonLabel="Add Product"
        onAddClick={() => navigate("/admin/products/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load products${error && "status" in error ? ` (${error.status})` : ""}.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No products match "${search}".` : "No products yet."
        }
        pagination={
          pagination
            ? {
                page: pagination.currentPage,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
                hasNextPage: pagination.hasNextPage,
                hasPrevPage: pagination.hasPrevPage,
              }
            : undefined
        }
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Product"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedProduct?.name}"</strong>? This action cannot be
            undone.
          </>
        }
      />
    </>
  );
};

export default ProductList;
