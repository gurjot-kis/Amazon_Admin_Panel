import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiPackage,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiShoppingBag,
} from "react-icons/fi";
import { useGetOrderByIdQuery } from "../../../features/order/orderApi";
import type {
  OrderStatus,
  PaymentStatus,
} from "../../../features/order/orderTypes";
import "../../../styles/order/OrderDetails.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

const API_ASSET_URL = import.meta.env.VITE_API_ASSET_URL || "";

const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  payment_pending: {
    label: "Payment Pending",
    dot: "#f59e0b",
    bg: "#fffbeb",
    text: "#92400e",
    border: "#fde68a",
  },
  pending: {
    label: "Pending",
    dot: "#f59e0b",
    bg: "#fffbeb",
    text: "#92400e",
    border: "#fde68a",
  },
  confirmed: {
    label: "Confirmed",
    dot: "#3b82f6",
    bg: "#eff6ff",
    text: "#1e40af",
    border: "#bfdbfe",
  },
  processing: {
    label: "Processing",
    dot: "#8b5cf6",
    bg: "#f5f3ff",
    text: "#5b21b6",
    border: "#ddd6fe",
  },
  packed: {
    label: "Packed",
    dot: "#06b6d4",
    bg: "#ecfeff",
    text: "#155e75",
    border: "#a5f3fc",
  },
  shipped: {
    label: "Shipped",
    dot: "#06b6d4",
    bg: "#ecfeff",
    text: "#155e75",
    border: "#a5f3fc",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    dot: "#f97316",
    bg: "#fff7ed",
    text: "#9a3412",
    border: "#fed7aa",
  },
  delivered: {
    label: "Delivered",
    dot: "#10b981",
    bg: "#ecfdf5",
    text: "#065f46",
    border: "#a7f3d0",
  },
  // completed: {
  //   label: "Completed",
  //   dot: "#10b981",
  //   bg: "#ecfdf5",
  //   text: "#065f46",
  //   border: "#a7f3d0",
  // },
  returned: {
    label: "Returned",
    dot: "#64748b",
    bg: "#f8fafc",
    text: "#334155",
    border: "#cbd5e1",
  },
  cancelled: {
    label: "Cancelled",
    dot: "#ef4444",
    bg: "#fef2f2",
    text: "#991b1b",
    border: "#fecaca",
  },
};

const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  paid: { label: "Paid", bg: "#ecfdf5", text: "#065f46" },
  pending: { label: "Pending", bg: "#fffbeb", text: "#92400e" },
  failed: { label: "Failed", bg: "#fef2f2", text: "#991b1b" },
  refunded: { label: "Refunded", bg: "#f1f5f9", text: "#475569" },
};

const formatCurrency = (amount?: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveItemImage = (src?: string | null) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;

  // Appends VITE_API_ASSET_URL to relative paths
  return `${API_ASSET_URL.replace(/\/+$/, "")}/${src.replace(/^\/+/, "")}`;
};

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useGetOrderByIdQuery(
    orderId || "",
    { skip: !orderId },
  );

  const order = data?.data;

  if (isLoading) {
    return (
      <FullScreenLoader
        title=" Loading Order Details"
        subtitle="Preparing your summary and tracking info..."
      />
    );
  }

  if (isError || !order) {
    return (
      <div className="od-page-state">
        <FiAlertCircle className="od-error-icon" />
        <h3>Unable to load order</h3>
        <p>
          {error && "status" in error
            ? `Error status: ${error.status}`
            : "The requested order could not be found."}
        </p>
        <div className="od-state-actions">
          <button
            type="button"
            className="od-btn od-btn--secondary"
            onClick={() => navigate("/admin/orders")}
          >
            Back to Orders
          </button>
          <button
            type="button"
            className="od-btn od-btn--primary"
            onClick={refetch}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentStatusConfig =
    ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
  const currentPaymentConfig =
    PAYMENT_STATUS_MAP[order.paymentStatus] || PAYMENT_STATUS_MAP.pending;

  return (
    <div className="od-container">
      {/* Top Bar Navigation */}
      <header className="od-header">
        <div className="od-header-left">
          <button
            type="button"
            className="od-back-btn"
            onClick={() => navigate("/admin/orders")}
            title="Back to all orders"
          >
            <FiArrowLeft />
          </button>
          <div>
            <div className="od-title-row">
              <h1 className="od-title">{order.orderNumber}</h1>
              <span
                className="od-status-pill"
                style={{
                  backgroundColor: currentStatusConfig.bg,
                  color: currentStatusConfig.text,
                  borderColor: currentStatusConfig.border,
                }}
              >
                <span
                  className="od-status-dot"
                  style={{ backgroundColor: currentStatusConfig.dot }}
                />
                {currentStatusConfig.label}
              </span>
            </div>
            <p className="od-subtitle">
              Placed on {formatDate(order.createdAt)} • Ref: {order._id}
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="od-grid">
        {/* Left Column (Items & Status Timeline) */}
        <div className="od-col-main">
          {/* Order Items Table */}
          <section className="od-card">
            <div className="od-card-header">
              <div className="od-card-title">
                <FiPackage className="od-icon" />
                <span>Order Items ({order.items.length})</span>
              </div>
            </div>

            <div className="od-table-wrap">
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Item Details</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const imgUrl = resolveItemImage(item.snapshot.mainImage);
                    return (
                      <tr key={item.product_id || idx}>
                        <td>
                          <div className="od-item-info">
                            <div className="od-item-thumb">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.snapshot.name}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = "none";
                                    const fallback =
                                      target.nextElementSibling as HTMLElement;
                                    if (fallback)
                                      fallback.classList.remove("d-none");
                                  }}
                                />
                              ) : null}
                              <span
                                className={`od-thumb-fallback ${imgUrl ? "d-none" : ""}`}
                              >
                                <FiShoppingBag />
                              </span>
                            </div>

                            <div className="od-item-text">
                              <div className="od-item-name">
                                {item.snapshot.name}
                              </div>
                              {item.variant?.label && (
                                <span className="od-variant-badge">
                                  {item.variant.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center od-font-semibold">
                          {item.quantity}
                        </td>
                        <td className="text-end od-text-muted">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-end od-font-semibold od-text-navy">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Status Timeline */}
          <section className="od-card">
            <div className="od-card-header">
              <div className="od-card-title">
                <FiClock className="od-icon" />
                <span>Order Activity Timeline</span>
              </div>
            </div>

            <div className="od-timeline">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                order.statusHistory.map((history, i) => (
                  <div key={i} className="od-timeline-item">
                    <div className="od-timeline-marker">
                      <FiCheckCircle />
                    </div>
                    <div className="od-timeline-content">
                      <div className="od-timeline-top">
                        <span className="od-timeline-status">
                          {history.status
                            ? history.status.replace(/_/g, " ").toUpperCase()
                            : "N/A"}
                        </span>
                        <span className="od-timeline-date">
                          {formatDate(history.changedAt)}
                        </span>
                      </div>
                      <p className="od-timeline-note">{history.note}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="od-no-data">No timeline events recorded.</p>
              )}
            </div>
          </section>

          {/* Cancellation Info (Conditional) */}
          {order.status === "cancelled" && (
            <section className="od-card od-card--cancelled">
              <div className="od-card-header">
                <div className="od-card-title od-text-danger">
                  <FiAlertCircle className="od-icon" />
                  <span>Cancellation Information</span>
                </div>
              </div>
              <div className="od-cancel-grid">
                <div className="od-cancel-item">
                  <span className="od-cancel-label">Cancelled By</span>
                  <span className="od-cancel-value od-capitalize">
                    {order.cancellation.cancelledBy || "Unknown"}
                  </span>
                </div>
                <div className="od-cancel-item">
                  <span className="od-cancel-label">Cancelled At</span>
                  <span className="od-cancel-value">
                    {formatDate(order.cancellation.cancelledAt)}
                  </span>
                </div>
                <div className="od-cancel-item od-cancel-item--full">
                  <span className="od-cancel-label">Reason</span>
                  <span className="od-cancel-value od-cancel-reason">
                    {order.cancellation.reason ||
                      "No cancellation reason provided."}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Pricing, Payment & Metadata) */}
        <div className="od-col-side">
          {/* Pricing Summary */}
          <section className="od-card">
            <div className="od-card-header">
              <div className="od-card-title">
                <FiCreditCard className="od-icon" />
                <span>Payment & Pricing</span>
              </div>
            </div>

            <div className="od-pricing-list">
              <div className="od-pricing-row">
                <span>Items Subtotal</span>
                <span>{formatCurrency(order.pricing.itemsTotal)}</span>
              </div>
              <div className="od-pricing-row">
                <span>Estimated Tax</span>
                <span>{formatCurrency(order.pricing.taxAmount)}</span>
              </div>
              <div className="od-pricing-row">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.pricing.deliveryFee)}</span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="od-pricing-row od-pricing-row--discount">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.pricing.discount)}</span>
                </div>
              )}
              <div className="od-pricing-divider" />
              <div className="od-pricing-row od-pricing-row--grand">
                <span>Grand Total</span>
                <span>{formatCurrency(order.pricing.grandTotal)}</span>
              </div>
            </div>

            <div className="od-payment-meta">
              <div className="od-meta-badge-row">
                <span className="od-meta-tag">
                  {order.paymentMethod?.toUpperCase() || "N/A"}
                </span>
                <span
                  className="od-badge"
                  style={{
                    backgroundColor: currentPaymentConfig.bg,
                    color: currentPaymentConfig.text,
                  }}
                >
                  {currentPaymentConfig.label}
                </span>
              </div>

              {order.payment_id?.transactionId && (
                <div className="od-meta-line">
                  <span>Transaction Ref:</span>
                  <strong title={order.payment_id.transactionId}>
                    {order.payment_id.transactionId}
                  </strong>
                </div>
              )}
            </div>
          </section>

          {/* Reference & Identifiers */}
          <section className="od-card">
            <div className="od-card-header">
              <div className="od-card-title">
                <FiFileText className="od-icon" />
                <span>Order Meta & Links</span>
              </div>
            </div>

            <div className="od-info-list">
              <div className="od-info-row">
                <span className="od-info-label">Customer ID</span>
                <span className="od-info-val od-mono" title={order.user}>
                  {order.user}
                </span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Slot Booking ID</span>
                <span
                  className="od-info-val od-mono"
                  title={order.slotBooking_id}
                >
                  {order.slotBooking_id}
                </span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Address ID</span>
                <span className="od-info-val od-mono" title={order.address_id}>
                  {order.address_id}
                </span>
              </div>
              {order.vendor_id && (
                <div className="od-info-row">
                  <span className="od-info-label">Assigned Vendor</span>
                  <span className="od-info-val od-mono">{order.vendor_id}</span>
                </div>
              )}
            </div>

            {order.notes && (
              <div className="od-order-notes">
                <span className="od-notes-label">Customer Instructions:</span>
                <p>“{order.notes}”</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
