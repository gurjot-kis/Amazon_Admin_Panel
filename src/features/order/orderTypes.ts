export type OrderStatus =
  | "payment_pending"
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "COD" | "ONLINE" | "WALLET";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CancellationCancelledBy = "user" | "admin" | "vendor" | null;

export interface OrderStore {
  _id: string;
  name: string;
  logo: string;
}

// Vendor order list item
export interface Order {
  _id: string;
  store: OrderStore;
  customerName: string;
  phone: string;
  city: string;
  totalItems: number;
  vendorTotal: number;
  paymentMethod: PaymentMethod;
  paymentReceived: 0 | 1;
  status: OrderStatus;
  createdAt: string;
  itemNames: string[];
  previewImage: string | null;
  moreItems: number;
  nextStatuses: OrderStatus[];
}

// Pagination
export interface OrderPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Get orders API params with search and store_id
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  store_id?: string;
}

export interface GetAdminOrderCountParams {
  search?: string;
  vendor_id?: string;
  page?: number;
  limit?: number;
}

// Get orders API response
export interface GetOrdersResponse {
  success: boolean;
  code: number;
  message: string;
  data: Order[];
  pagination: OrderPagination;
}

// Existing order details types
export interface OrderPricing {
  itemsTotal: number;
  taxAmount: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
}

export interface OrderCancellation {
  cancelledBy: CancellationCancelledBy;
  reason: string | null;
  cancelledAt: string | null;
  refundAmount: number | null;
}

export interface OrderItemSnapshot {
  name: string;
  slug: string;
  mainImage: string;
}

export interface OrderItemVariant {
  key: string;
  label: string;
  image: string | null;
}

export interface OrderItem {
  snapshot: OrderItemSnapshot;
  variant: OrderItemVariant;
  product_id: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderPayment {
  _id: string;
  user: string;
  order_id: string;
  slotBooking_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: string;
  status: PaymentStatus;
  providerOrderId: string | null;
  transactionId: string | null;
  signature: string | null;
  gatewayResponse: unknown | null;
  paidAt: string | null;
  failureReason: string | null;
  attempt: number;
  refunds: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  status: string;
  note: string;
  changedAt: string;
}

export interface GetOrderByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: OrderDetails;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  code: number;
  message: string;
  data: OrderDetails;
}

export interface OrderItemVariantOption {
  name: string;
  value: string;
}

export interface OrderItemVariant {
  sku: string;
  options: OrderItemVariantOption[];
}

export interface OrderDetailItem {
  product_id: string;
  variant_id: string | null;
  variant: OrderItemVariant | null;
  name: string;
  slug: string;
  mainImage: string;
  currency: string;
  price: number;
  sellingPrice: number;
  quantity: number;
  itemTotal: number;
}

export interface OrderShippingAddress {
  address_id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface OrderDetails {
  _id: string;
  items: OrderDetailItem[];
  totalItems: number;
  vendorTotal: number;
  shippingAddress: OrderShippingAddress;
  paymentMethod: PaymentMethod;
  paymentReceived: 0 | 1;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  store: OrderStore;
}

export interface GetOrderByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: OrderDetails;
}

export interface AdminOrderStore {
  store_id: string;
  store_name: string;
  store_logo: string;
  vendor_id: string;
  vendor_name: string;
  vendor_image: string;
  orderCount: number;
  orderAmount: number;
  itemsAmount: number;
}

export interface GetAdminOrderCountResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    stores: AdminOrderStore[];
    pagination: OrderPagination;
  };
}
