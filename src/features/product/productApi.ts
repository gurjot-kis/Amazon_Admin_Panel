import { baseApi } from "../../store/api/baseApi";
import type {
  GetProductByIdResponse,
  GetProductsParams,
  GetProductsResponse,
  ProductStatus,
} from "./productTypes";

export interface UpdateProductStatusPayload {
  id: string;
  status: ProductStatus;
}

export interface UpdateProductPayload {
  productId: string;
  formData: FormData;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchProducts: builder.query<GetProductsResponse, GetProductsParams>({
      query: ({ page, limit, search, categoryId, subCategoryId }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (categoryId) params.set("categoryId", categoryId);
        if (subCategoryId) params.set("subCategoryId", subCategoryId);

        const qs = params.toString();
        return {
          url: `/admin/product${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Product"],
    }),

    createProduct: builder.mutation<void, FormData>({
      query: (formData) => ({
        url: `/admin/product`,
        method: "POST",
        body: formData,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Product"],
    }),

    getProductById: builder.query<GetProductByIdResponse, string>({
      query: (id) => ({
        url: `/admin/product/${id}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Product"],
    }),

    updateProduct: builder.mutation<void, UpdateProductPayload>({
      query: ({ productId, formData }) => ({
        url: `/admin/product/${productId}`,
        method: "PUT",
        body: formData,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Product"],
    }),

    updateProductStatus: builder.mutation<void, UpdateProductStatusPayload>({
      query: ({ id, status }) => ({
        url: `/admin/product/${id}/status`,
        method: "PATCH",
        body: {
          status,
        },
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/product/${id}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useFetchProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
} = productApi;
