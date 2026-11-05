import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LuArrowLeft,
  LuPhone,
  LuMapPin,
  LuCalendar,
  LuCreditCard,
  LuClock,
  LuStore,
  LuBox,
  LuShoppingBag,
  LuTruck,
  LuPackage,
} from "react-icons/lu";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

import {
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
} from "../../../features/order/orderApi";
import type { OrderStatus } from "../../../features/order/orderTypes";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/order/OrderDetails.css";

const ASSET_URL = import.meta.env.VITE_API_ASSET_URL as string;

const resolveImage = (path?: string | null) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${ASSET_URL}${path}`;
};

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    className: string;
    dot: string;
    icon: React.FC<{ size?: number }>;
  }
> = {
  payment_pending: {
    label: "Payment Pending",
    className: "od-status--amber",
    dot: "#d97706",
    icon: LuClock,
  },
  placed: {
    label: "Placed",
    className: "od-status--blue",
    dot: "#2563eb",
    icon: LuShoppingBag,
  },
  confirmed: {
    label: "Confirmed",
    className: "od-status--indigo",
    dot: "#4f46e5",
    icon: FiCheckCircle,
  },
  packed: {
    label: "Packed",
    className: "od-status--purple",
    dot: "#9333ea",
    icon: LuPackage,
  },
  shipped: {
    label: "Shipped",
    className: "od-status--cyan",
    dot: "#0891b2",
    icon: LuTruck,
  },
  delivered: {
    label: "Delivered",
    className: "od-status--green",
    dot: "#16a34a",
    icon: FiCheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "od-status--rose",
    dot: "#e11d48",
    icon: FiXCircle,
  },
};

const STEPS: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

const fmt = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const { data, isLoading, isError, error } = useGetOrderByIdQuery(
    orderId ?? "",
    { skip: !orderId },
  );

  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();

  const order = data?.data;

  useEffect(() => {
    setHeaderConfig({
      title: order
        ? `Order #${order._id.slice(-8).toUpperCase()}`
        : "Order Details",
      subtitle:
        "Review order items, customer destination, and processing steps",
    });
  }, [setHeaderConfig, order]);

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    if (!orderId) return;
    if (nextStatus === "cancelled") {
      const confirmed = window.confirm(
        "Cancel this order? This will release reserved inventory and refund any received payments.",
      );
      if (!confirmed) return;
    }

    try {
      await updateOrderStatus({ orderId, status: nextStatus }).unwrap();
      toast.success("Order status updated", {
        description: `Order is now marked as ${ORDER_STATUS_CONFIG[nextStatus]?.label ?? nextStatus}.`,
      });
    } catch (err: any) {
      toast.error("Failed to update status", {
        description: err?.data?.message || "Could not complete operation.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="od-state">
        <div className="od-spinner" />
        <p>Loading order details…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="od-state od-state--error">
        <LuBox size={40} />
        <h3>Unable to load order</h3>
        <p>{(error as any)?.data?.message || "Order not found."}</p>
        <button
          type="button"
          className="od-back-btn"
          onClick={() => navigate(-1)}
        >
          <LuArrowLeft size={15} /> Go Back
        </button>
      </div>
    );
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    className: "od-status--gray",
    dot: "#64748b",
    icon: LuBox,
  };
  const StatusIcon = statusCfg.icon;

  const currentStepIdx = STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isPaid = order.paymentReceived === 1;

  return (
    <div className="od-page">
      {/* ── Top Bar ── */}
      <div className="od-header-bar">
        <button
          type="button"
          className="od-back-btn"
          onClick={() => navigate(-1)}
        >
          <LuArrowLeft size={16} /> Back to Orders
        </button>

        <div className="od-header-actions">
          <span className={`od-status-badge ${statusCfg.className}`}>
            <StatusIcon size={14} />
            <span>{statusCfg.label}</span>
          </span>

          {order.status === "placed" && (
            <button
              type="button"
              className="od-action-btn od-action-btn--primary"
              disabled={isUpdating}
              onClick={() => handleStatusChange("confirmed")}
            >
              Confirm Order
            </button>
          )}

          {order.status === "confirmed" && (
            <button
              type="button"
              className="od-action-btn od-action-btn--primary"
              disabled={isUpdating}
              onClick={() => handleStatusChange("packed")}
            >
              Mark Packed
            </button>
          )}

          {order.status === "packed" && (
            <button
              type="button"
              className="od-action-btn od-action-btn--primary"
              disabled={isUpdating}
              onClick={() => handleStatusChange("shipped")}
            >
              Ship Order
            </button>
          )}

          {order.status === "shipped" && (
            <button
              type="button"
              className="od-action-btn od-action-btn--success"
              disabled={isUpdating}
              onClick={() => handleStatusChange("delivered")}
            >
              Mark Delivered
            </button>
          )}

          {!isCancelled && order.status !== "delivered" && (
            <button
              type="button"
              className="od-action-btn od-action-btn--danger"
              disabled={isUpdating}
              onClick={() => handleStatusChange("cancelled")}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Progress Pipeline Tracker ── */}
      <div className="od-card od-tracker-card">
        <div className="od-tracker-meta">
          <span className="od-tracker-id">
            Order Reference: <strong>#{order._id.toUpperCase()}</strong>
          </span>
          <span className="od-tracker-date">
            <LuCalendar size={13} /> Placed on {formatDateTime(order.createdAt)}
          </span>
        </div>

        {isCancelled ? (
          <div className="od-cancelled-banner">
            <FiXCircle size={18} />
            <div>
              <strong>Order has been cancelled</strong>
              <p>Fulfillment terminated and inventory restored to catalog.</p>
            </div>
          </div>
        ) : (
          <div className="od-stepper">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              const StepIcon = ORDER_STATUS_CONFIG[step]?.icon || LuBox;

              return (
                <div
                  key={step}
                  className={`od-step ${isCompleted ? "is-completed" : ""} ${isCurrent ? "is-current" : ""}`}
                >
                  <div className="od-step-node">
                    <StepIcon size={14} />
                  </div>
                  <span className="od-step-title">
                    {ORDER_STATUS_CONFIG[step]?.label ?? step}
                  </span>
                  {idx < STEPS.length - 1 && <div className="od-step-bar" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main 2-Column Content ── */}
      <div className="od-main-grid">
        {/* Left Column: Order Items */}
        <div className="od-left-col">
          <div className="od-card">
            <div className="od-card-header">
              <div className="od-card-title-group">
                <LuBox size={16} />
                <h3 className="od-card-title">Purchased Items</h3>
              </div>
              <span className="od-badge-count">
                {order.totalItems} Items Total
              </span>
            </div>

            <div className="od-items-list">
              {order.items.map((item, i) => (
                <div
                  key={item.variant_id ?? `${item.product_id}-${i}`}
                  className="od-item-row"
                >
                  <div className="od-item-img-frame">
                    {item.mainImage ? (
                      <img
                        src={resolveImage(item.mainImage) || undefined}
                        alt={item.name}
                        className="od-item-img"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="od-item-img-placeholder">
                        <LuBox size={16} />
                      </div>
                    )}
                  </div>

                  <div className="od-item-content">
                    <h4 className="od-item-name">{item.name}</h4>

                    {item.variant && (
                      <div className="od-variant-tags">
                        <span className="od-sku-chip">{item.variant.sku}</span>
                        {item.variant.options.map((opt) => (
                          <span key={opt.name} className="od-option-chip">
                            {opt.name}: <strong>{opt.value}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="od-item-price-line">
                      <span className="od-unit-price">
                        {fmt(item.sellingPrice, item.currency)}
                      </span>
                      {item.price > item.sellingPrice && (
                        <span className="od-strike-price">
                          {fmt(item.price, item.currency)}
                        </span>
                      )}
                      <span className="od-qty">× {item.quantity}</span>
                    </div>
                  </div>

                  <div className="od-item-total">
                    {fmt(item.itemTotal, item.currency)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="od-summary-section">
              <div className="od-summary-row">
                <span>Subtotal ({order.totalItems} items)</span>
                <span>{fmt(order.vendorTotal)}</span>
              </div>
              <div className="od-summary-row">
                <span>Delivery Charge</span>
                <span className="od-free-chip">Free</span>
              </div>
              <div className="od-summary-divider" />
              <div className="od-summary-row od-summary-total">
                <span>Vendor Total</span>
                <span className="od-grand-price">{fmt(order.vendorTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cards */}
        <div className="od-right-col">
          {/* Store Origin Card */}
          <div className="od-card">
            <div className="od-card-header">
              <div className="od-card-title-group">
                <LuStore size={16} />
                <h3 className="od-card-title">Fulfilling Store</h3>
              </div>
            </div>
            <div className="od-store-body">
              {order.store?.logo ? (
                <img
                  src={resolveImage(order.store.logo) || undefined}
                  alt={order.store.name}
                  className="od-store-logo"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="od-store-avatar">
                  {order.store?.name?.[0]?.toUpperCase() ?? "S"}
                </div>
              )}
              <div className="od-store-info">
                <span className="od-store-name">
                  {order.store?.name ?? "—"}
                </span>
                <span className="od-store-id">ID: {order.store?._id}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Destination */}
          <div className="od-card">
            <div className="od-card-header">
              <div className="od-card-title-group">
                <LuMapPin size={16} />
                <h3 className="od-card-title">Customer Destination</h3>
              </div>
            </div>
            <div className="od-address-body">
              <h4 className="od-recipient-name">
                {order.shippingAddress?.fullName || "—"}
              </h4>
              <div className="od-address-text">
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                {order.shippingAddress?.landmark && (
                  <p className="od-landmark">
                    Landmark: {order.shippingAddress.landmark}
                  </p>
                )}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  - <strong>{order.shippingAddress?.pincode}</strong>
                </p>
                <p>{order.shippingAddress?.country}</p>
              </div>

              {order.shippingAddress?.phone && (
                <a
                  href={`tel:${order.shippingAddress.phone}`}
                  className="od-contact-pill"
                >
                  <LuPhone size={13} /> {order.shippingAddress.phone}
                </a>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="od-card">
            <div className="od-card-header">
              <div className="od-card-title-group">
                <LuCreditCard size={16} />
                <h3 className="od-card-title">Payment Info</h3>
              </div>
            </div>
            <div className="od-payment-body">
              <div className="od-payment-row">
                <span className="od-label">Payment Method</span>
                <span className="od-method-tag">{order.paymentMethod}</span>
              </div>
              <div className="od-payment-row">
                <span className="od-label">Payment Status</span>
                <span
                  className={`od-payment-chip ${isPaid ? "is-paid" : "is-pending"}`}
                >
                  <span className="od-dot" />
                  {isPaid ? "Received / Settled" : "Pending Collection (COD)"}
                </span>
              </div>
              <div className="od-payment-row">
                <span className="od-label">Last Updated</span>
                <span className="od-value">
                  {formatDateTime(order.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
