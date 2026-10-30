export interface CouponUserDetails {
  _id: string;
  name: string;
  image: string | null;
}

export interface Coupon {
  _id: string;
  code: string;
  title: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number;
  per_user_limit: number;
  used_count: number;
  scope: "global" | "store";
  created_by: string;
  created_by_role: string;
  store_ids: string[];
  start_date: string;
  end_date: string;
  status: number;
  website_image: string | null;
  mobile_image: string | null;
  createdAt: string;
  updatedAt: string;
  user_details: CouponUserDetails | null;
}

export interface CouponPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CouponListResponse {
  success: boolean;
  code: number;
  message: string;
  data: Coupon[];
  pagination: CouponPagination;
}

export interface GetCouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  scope?: "global" | "store";
}

export interface CreateCouponPayload {
  // Required fields
  code: string;
  title: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;

  // Optional fields
  description?: string;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number;
  per_user_limit?: number;
  scope?: "global" | "store";
  store_ids?: string[];
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;
