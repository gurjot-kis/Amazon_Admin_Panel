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

// --------------------------------- Variant Type -------------------------------
export interface VariantType {
  _id: string;
  name: string;
  slug: string;
  display_order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}


export type GetVariantTypesResponse = ApiResponse<VariantType[]>;

export interface GetVariantTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

export interface CreateVariantTypePayload {
  name: string;
}

// --------------------------------- Variant Option -------------------------------
export interface VariantTypeReference {
  _id: string;
  name: string;
  slug: string;
}

export interface VariantOption {
  _id: string;
  variant_type_id: VariantTypeReference;
  value: string;
  label: string;
  meta: Record<string, string>;
  display_order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export type GetVariantOptionsResponse = ApiResponse<VariantOption[]>;

export interface GetVariantOptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
  variant_type_id?: string;
}

export interface CreateVariantOptionPayload {
  variant_type_id: string;
  value: string;
  label?: string;
  meta?: Record<string, string>;
}

export interface UpdateVariantOptionPayload {
  value?: string;
  label?: string;
  display_order?: number;
}