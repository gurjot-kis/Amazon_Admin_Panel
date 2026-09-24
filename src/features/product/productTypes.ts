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

export interface ProductCategory {
  _id: string;
  name: string;
  category_image: string;
}

export type ProductStatus = "pending" | "active" | "inactive" | "rejected";

export type StockStatus = "in_stock" | "out_of_stock";

export interface Product {
  _id: string;
  name: string;
  mainImage: string;
  sku: string;
  currency: string;
  costPrice: number;
  sellingPrice: number;
  price: number;
  stock: number;
  stockStatus: StockStatus;
  status: ProductStatus;
  hasVariants: boolean;
  createdAt: string;
  category: ProductCategory;
}

export type GetProductsResponse = ApiResponse<Product[]>;

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  status?: ProductStatus;
}
