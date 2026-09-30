export type CategoryType = "quick_commerce" | "standard_commerce";

export interface Category {
  _id: string;
  name: string;
  category_type: CategoryType;
  level: number;
  description?: string;
  category_image?: string;
  status: "active" | "inactive" | string;
  children?: Category[];
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
  maxLevel?: number;
}

export type GetCategoriesResponse = ApiResponse<Category[]>;

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  category_type?: CategoryType;
}

export interface CategoryRow {
  category: Category;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface FlatCategoryOption {
  _id: string;
  name: string;
  level: number;
  depth: number;
  category_type?: CategoryType;
}

export interface ExtendedFormState {
  name: string;
  category_type: CategoryType;
  parent_id: string;
  description: string;
  category_image: File | null;
}

//Add Category Types
export interface SlotConfig {
  allowInstant: boolean;
  allowSchedule: boolean;
}

export interface FormState {
  name: string;
  parent_id: string;
  description: string;
  category_image: File | null;
  slotConfig: SlotConfig;
}

// Leaf category Types
export interface LeafCategory {
  _id: string;
  parent_id: string;
  name: string;
}

export type GetLeafCategoriesResponse = ApiResponse<LeafCategory[]>;

export interface SelectCategory {
  _id: string;
  name: string;
  level: number;
  depth: number;
  category_type: CategoryType;
}

export type GetCategoriesSelectListResponse = ApiResponse<SelectCategory[]>;
export interface GetLeafCategoriesParams {
  search?: string;
}
