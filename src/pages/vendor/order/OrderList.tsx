import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FiEye,
  FiShoppingBag,
  FiCheckCircle,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { LuPhone, LuMapPin } from "react-icons/lu";

import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../../features/order/orderApi";
import { useFetchVendorActiveStoresQuery } from "../../../features/store/storeApi";
import type { Order, OrderStatus } from "../../../features/order/orderTypes";
import { DataTable } from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/order/OrderList.css";

const PAGE_LIMIT = 10;
const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

const resolveImage = (path?: string | null) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${ASSET_URL}${path}`;
};

type StatusConfig = {
  label: string;
  className: string;
  dot: string;
  icon: React.FC<{ size?: number }>;
};

// Statuses a vendor can see (payment_pending orders are never returned).
const ORDER_STATUS_CONFIG: Partial<Record<OrderStatus, StatusConfig>> = {
  placed: {
    label: "Placed",
    className: "ol-s--blue",
    dot: "#2563eb",
    icon: FiShoppingBag,
  },
  confirmed: {
    label: "Confirmed",
    className: "ol-s--indigo",
    dot: "#4f46e5",
    icon: FiCheckCircle,
  },
  packed: {
    label: "Packed",
    className: "ol-s--purple",
    dot: "#9333ea",
    icon: FiPackage,
  },
  shipped: {
    label: "Shipped",
    className: "ol-s--cyan",
    dot: "#0891b2",
    icon: FiTruck,
  },
  delivered: {
    label: "Delivered",
    className: "ol-s--green",
    dot: "#16a34a",
    icon: FiCheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "ol-s--rose",
    dot: "#e11d48",
    icon: FiXCircle,
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: "Unknown",
  className: "ol-s--gray",
  dot: "#64748b",
  icon: FiShoppingBag,
};

const getCfg = (status: OrderStatus): StatusConfig =>
  ORDER_STATUS_CONFIG[status] ?? { ...FALLBACK_CONFIG, label: status };

const FILTER_STATUSES = Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ── Status badge + dropdown of valid next statuses ───────── */
const OrderStatusDropdown = ({
  current,
  nextStatuses,
  orderId,
  onUpdate,
  isUpdating,
}: {
  current: OrderStatus;
  nextStatuses: OrderStatus[];
  orderId: string;
  onUpdate: (id: string, status: OrderStatus) => void;
  isUpdating: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cfg = getCfg(current);
  const Icon = cfg.icon;
  const canChange = nextStatuses.length > 0;

  const toggleDropdown = () => {
    if (isUpdating || !canChange) return;
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        btnRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <div className="ol-status-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`ol-status-badge ${cfg.className} ${isUpdating ? "is-busy" : ""}`}
        onClick={toggleDropdown}
        disabled={isUpdating}
        style={!canChange ? { cursor: "default" } : undefined}
        aria-haspopup={canChange ? "listbox" : undefined}
        aria-expanded={canChange ? open : undefined}
        title={canChange ? "Update status" : "Final status"}
      >
        {isUpdating ? (
          <span className="ol-status-spinner" />
        ) : (
          <Icon size={12} />
        )}
        <span>{cfg.label}</span>
        {!isUpdating && canChange && (
          <svg
            className={`ol-status-chevron ${open ? "is-open" : ""}`}
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
        )}
      </button>

      {open &&
        canChange &&
        createPortal(
          <div
            ref={panelRef}
            className="ol-status-panel"
            role="listbox"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
          >
            {nextStatuses.map((st) => {
              const opt = getCfg(st);
              const OptIcon = opt.icon;
              return (
                <button
                  key={st}
                  type="button"
                  className={`ol-status-item ${opt.className}`}
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    setOpen(false);
                    onUpdate(orderId, st);
                  }}
                >
                  <OptIcon size={13} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [page, setPage] = useState<number>(1);
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setHeaderConfig({
      title: "Orders Management",
      subtitle: "Track order fulfillment, payments, and delivery progression",
    });
  }, [setHeaderConfig]);

  // Debounce search so the server isn't hit on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: storesData } = useFetchVendorActiveStoresQuery();
  const stores = storesData?.data ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAllOrdersQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      store_id: storeFilter === "all" ? undefined : storeFilter,
    });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    if (status === "cancelled") {
      const ok = window.confirm(
        "Cancel this order? Stock will be restored and any payment refunded. This cannot be undone.",
      );
      if (!ok) return;
    }

    setUpdatingId(orderId);
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
      toast.success("Order status updated", {
        description: `Order marked as ${getCfg(status).label}.`,
      });
    } catch (err: any) {
      toast.error("Failed to update status", {
        description: err?.data?.message || "Something went wrong.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: DataTableColumn<Order>[] = [
    {
      key: "_id",
      header: "Order ID",
      isPrimary: true,
      render: (order) => (
        <div className="ol-order-cell">
          <div className="ol-thumb-box">
            {order.previewImage ? (
              <img
                src={resolveImage(order.previewImage) || undefined}
                alt=""
                className="ol-thumb-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget
                    .nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="ol-thumb-fallback"
              style={{ display: order.previewImage ? "none" : "flex" }}
            >
              <FiShoppingBag size={14} />
            </span>
          </div>

          <div className="ol-order-meta">
            <span className="ol-order-id" title={order._id}>
              #{order._id.slice(-8).toUpperCase()}
            </span>
            <span className="ol-order-date">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "store",
      header: "Store",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (order) => (
        <div className="ol-store-pill">
          {order.store?.logo ? (
            <img
              src={resolveImage(order.store.logo) || undefined}
              alt={order.store.name}
              className="ol-store-pill-img"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="ol-store-pill-avatar">
              {order.store?.name?.[0]?.toUpperCase() ?? "S"}
            </div>
          )}
          <span className="ol-store-pill-name" title={order.store?.name}>
            {order.store?.name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (order) => (
        <div className="ol-customer-cell">
          <span className="ol-customer-name">{order.customerName || "—"}</span>
          <div className="ol-customer-sub">
            {order.phone && (
              <span className="ol-sub-line">
                <LuPhone size={12} /> {order.phone}
              </span>
            )}
            {order.city && (
              <span className="ol-sub-line">
                <LuMapPin size={12} /> {order.city}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "itemNames",
      header: "Items",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (order) => (
        <div className="ol-items-cell">
          <span className="ol-item-title" title={order.itemNames?.join(", ")}>
            {order.itemNames?.length ? order.itemNames.join(", ") : "—"}
          </span>
          {order.moreItems > 0 && (
            <span className="ol-item-counter">+{order.moreItems} more</span>
          )}
        </div>
      ),
    },
    {
      key: "vendorTotal",
      header: "Total",
      render: (order) => (
        <div className="ol-amount-cell">
          <span className="ol-amount-total">{fmt(order.vendorTotal)}</span>
          <span className="ol-amount-items">
            {order.totalItems} item{order.totalItems !== 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (order) => {
        const isPaid = order.paymentReceived === 1;
        return (
          <div className="ol-pay-cell">
            <span className="ol-pay-badge">{order.paymentMethod}</span>
            <span
              className={`ol-pay-status ${isPaid ? "is-paid" : "is-unpaid"}`}
            >
              <span className="ol-pay-dot" />
              {isPaid ? "Paid" : "Pending"}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (order) => (
        <OrderStatusDropdown
          current={order.status}
          nextStatuses={order.nextStatuses ?? []}
          orderId={order._id}
          onUpdate={handleStatusUpdate}
          isUpdating={updatingId === order._id}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (order) => (
        <div className="ol-actions">
          <button
            type="button"
            className="ol-action-btn"
            title="View Order Details"
            onClick={() => navigate(`/vendor/orders/${order._id}/details`)}
          >
            <FiEye color="#1b3a5c" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ol-page">
      <DataTable
        statPills={[
          {
            label: `${pagination?.total ?? orders.length} Total Orders`,
            navy: true,
          },
        ]}
        columns={columns}
        data={orders}
        getId={(o) => o._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search order ID, customer, city, product..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v as OrderStatus | "all");
              setPage(1);
            },
            options: [
              { value: "all", label: "All Statuses" },
              ...FILTER_STATUSES.map((s) => ({
                value: s,
                label: getCfg(s).label,
                badgeDot: getCfg(s).dot,
              })),
            ],
          },
          {
            value: storeFilter,
            onChange: (v) => {
              setStoreFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Stores" },
              ...stores.map((s) => ({
                value: s._id,
                label: s.store_name,
                image: resolveImage(s.store_logo),
              })),
            ],
          },
        ]}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load orders${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search
            ? `No orders match "${search}".`
            : "No orders found in records."
        }
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
};

export default OrderList;
