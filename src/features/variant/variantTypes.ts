export interface VariantType {
  _id: string;
  name: string;
  slug: string;
  display_order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
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

export type GetVariantTypesResponse = ApiResponse<VariantType[]>;

export interface GetVariantTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

// Create Variant Type
export interface CreateVariantTypePayload {
  name: string;
}
