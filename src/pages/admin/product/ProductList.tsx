import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { DataTable } from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { useHeader } from "../../../layout/LayoutContext";
import { useGetProductsQuery } from "../../../features/product/productApi";
import type {
  Product,
  ProductStatus,
} from "../../../features/product/productTypes";
import "../../../styles/product/ProductList.css";
import { createPortal } from "react-dom";

const PAGE_LIMIT = 10;

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "pl-status--active" },
  inactive: { label: "Inactive", className: "pl-status--inactive" },
  pending: { label: "Pending", className: "pl-status--pending" },
  rejected: { label: "Rejected", className: "pl-status--rejected" },
};

const STOCK_CONFIG: Record<string, { label: string; className: string }> = {
  in_stock: { label: "In stock", className: "pl-stock--in" },
  out_of_stock: { label: "Out of stock", className: "pl-stock--out" },
};

const fmt = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const resolveImage = (path?: string) =>
  path ? `${import.meta.env.VITE_API_ASSET_URL}${path}` : null;

const StatusDropdown = ({
  current,
  productId,
  onUpdate,
}: {
  current: ProductStatus;
  productId: string;
  onUpdate: (id: string, status: ProductStatus) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[current];

  // position panel below the badge
  const openDropdown = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
    });
    setOpen(true);
  };

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="pl-status-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`pl-status-badge ${cfg.className}`}
        onClick={openDropdown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="pl-status-dot" />
        {cfg.label}
        <svg
          className={`pl-status-chevron ${open ? "is-open" : ""}`}
          width="10"
          height="10"
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

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="pl-status-panel"
            role="listbox"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
          >
            {(Object.keys(STATUS_CONFIG) as ProductStatus[]).map((s) => {
              const c = STATUS_CONFIG[s];
              const isActive = s === current;
              return (
                <button
                  key={s}
                  type="button"
                  className={`pl-status-option ${isActive ? "is-active" : ""}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    if (!isActive) onUpdate(productId, s);
                    setOpen(false);
                  }}
                >
                  <span className={`pl-status-option-dot pl-status--${s}`} />
                  {c.label}
                  {isActive && (
                    <svg
                      className="pl-status-check"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 13l4 4L19 7"
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

/* ── ImageCell ─────────────────────────────────────────── */
const ImageCell = ({ src, name }: { src: string | null; name: string }) => {
  const [errored, setErrored] = useState(false);
  return (
    <div className="pl-img-cell">
      {src && !errored ? (
        <img
          src={src}
          alt={name}
          className="pl-img"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="pl-img-fallback">
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
            <circle
              cx="8.5"
              cy="8.5"
              r="1.6"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M21 15l-5-5-9 9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </div>
  );
};

/* ── Component ─────────────────────────────────────────── */
const ProductList = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Products" });
  }, [setHeaderConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetProductsQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const statCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  /* status update — wire to your mutation when ready */
  const handleStatusUpdate = (id: string, status: ProductStatus) => {
    toast.info(`Status update for ${id} → ${status} (wire your mutation here)`);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    toast.success("Product deleted", {
      description: `"${selectedProduct.name}" removed.`,
    });
    setIsDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Product",
      isPrimary: true,
      render: (p) => (
        <div className="pl-product-cell">
          <ImageCell src={resolveImage(p.mainImage)} name={p.name} />
          <div className="pl-product-info">
            <span className="pl-product-name">{p.name}</span>
            <span className="pl-product-sku">SKU: {p.sku}</span>
            {p.hasVariants && (
              <span className="pl-variants-badge">Has variants</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (p) => (
        <span className="cl-level-tag cl-level-tag--1">
          {p.category?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "sellingPrice",
      header: "Price",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (p) => (
        <div className="pl-price-cell">
          <span className="pl-price-selling">
            {fmt(p.sellingPrice, p.currency)}
          </span>
          {p.costPrice > 0 && p.costPrice !== p.sellingPrice && (
            <span className="pl-price-cost">
              {fmt(p.costPrice, p.currency)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (p) => {
        const sc = STOCK_CONFIG[p.stockStatus];
        return (
          <div className="pl-stock-cell">
            <span className="pl-stock-qty">{p.stock}</span>
            <span className={`pl-stock-badge ${sc?.className ?? ""}`}>
              {sc?.label ?? p.stockStatus}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusDropdown
          current={p.status}
          productId={p._id}
          onUpdate={handleStatusUpdate}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (p) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => navigate(`/admin/products/${p._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(p)}
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
            label: `${pagination?.total ?? products.length} total`,
            navy: true,
          },
          ...Object.entries(statCounts)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => ({
              label: `${count} ${STATUS_CONFIG[status as ProductStatus]?.label ?? status}${statusFilter === "all" && !search ? " · this page" : ""}`,
            })),
        ]}
        columns={columns}
        data={products}
        getId={(p) => p._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search products..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v as ProductStatus | "all");
              setPage(1);
            },
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
        addButtonLabel="Add Product"
        onAddClick={() => navigate("/admin/products/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load products${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No products match "${search}".` : "No products yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={false}
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
