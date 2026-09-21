export interface Category {
  _id: string;
  name: string;
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
