export interface CartSettings {
  _id: string;
  cart_settings_id: string;
  handling_charge: number;
  delivery_charge: number;
  free_delivery_min_amount: number;
  small_cart_charge: number;
  small_cart_max_amount: number;
  user_id: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: Pagination;
}

export type GetCartSettingsResponse = ApiResponse<CartSettings[]>;

export type GetCartSettingsByIdResponse = ApiResponse<CartSettings>;

export type CreateCartSettingsResponse = ApiResponse<CartSettings>;

export type UpdateCartSettingsResponse = ApiResponse<CartSettings>;

export interface GetCartSettingsParams {
  page?: number;
  limit?: number;
  user_id?: string;
  role?: string;
}

export interface CreateCartSettingsPayload {
  handling_charge: number;
  delivery_charge: number;
  free_delivery_min_amount: number;
  small_cart_charge: number;
  small_cart_max_amount: number;
  user_id?: string;
  role?: string;
}

export interface UpdateCartSettingsPayload {
  cartSettingsId: string;
  data: Partial<{
    handling_charge: number;
    delivery_charge: number;
    free_delivery_min_amount: number;
    small_cart_charge: number;
    small_cart_max_amount: number;
  }>;
}
