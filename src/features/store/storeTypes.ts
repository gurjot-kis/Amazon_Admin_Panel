export type StoreStatus = "active" | "inactive" | "suspended";

export type StoreVerificationStatus = "pending" | "verified" | "rejected";

export interface StoreVendor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
}

export interface StoreLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Store {
  _id: string;
  vendor_id: string | StoreVendor;

  store_name: string;
  store_description?: string;

  email?: string;
  phone?: string;

  address: string;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;

  gst_number?: string;

  store_logo?: string;
  store_banner?: string;

  location?: StoreLocation;

  is_default?: boolean;

  status: StoreStatus;
  verification_status: StoreVerificationStatus;

  verified_at?: string | null;
  rejection_reason?: string;

  createdAt?: string;
  updatedAt?: string;

  // Included by the admin aggregation API.
  vendor?: StoreVendor;
}

export interface StorePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StoreApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: StorePagination;
}

export interface FetchAllStoresParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StoreStatus;
  verification_status?: StoreVerificationStatus;
  vendor_id?: string;
}

export interface FetchAllStoresResponse extends StoreApiResponse<Store[]> {
  pagination: StorePagination;
}

export type GetStoreByIdResponse = StoreApiResponse<Store>;

export interface UpdateStoreVerificationParams {
  storeId: string;
  verification_status: StoreVerificationStatus;
  rejection_reason?: string;
}

export type UpdateStoreVerificationResponse = StoreApiResponse<Store>;

export interface UpdateStoreStatusParams {
  storeId: string;
  status: StoreStatus;
}

export type UpdateStoreStatusResponse = StoreApiResponse<Store>;

// Vendor Store APIs

export interface FetchMyStoresParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StoreStatus;
  verification_status?: StoreVerificationStatus;
}

export interface FetchMyStoresResponse extends StoreApiResponse<Store[]> {
  pagination: StorePagination;
}

export interface CreateStorePayload {
  store_name: string;
  store_description?: string;
  email?: string;
  phone?: string;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  gst_number?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_default?: boolean;
  store_logo?: File | null;
  store_banner?: File | null;
}

export interface UpdateStorePayload extends Partial<CreateStorePayload> {
  storeId: string;
  remove_logo?: boolean;
  remove_banner?: boolean;
}

export interface StoreIdPayload {
  storeId: string;
}

export type CreateStoreResponse = StoreApiResponse<Store>;

export type GetMyStoreByIdResponse = StoreApiResponse<Store>;

export type UpdateStoreResponse = StoreApiResponse<Store>;

export type SetDefaultStoreResponse = StoreApiResponse<Store>;

export type ToggleStoreStatusResponse = StoreApiResponse<Store>;

export type DeleteStoreResponse = StoreApiResponse<null>;
