import { baseApi } from "../../store/api/baseApi";
import type {
  GetCategoriesParams,
  GetCategoriesResponse,
} from "./categoryTypes";

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<GetCategoriesResponse, GetCategoriesParams>({
      query: ({ page, limit, search, level }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (level !== undefined) params.set("level", String(level));

        const qs = params.toString();
        return {
          url: `/admin/category${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Category"],
    }),
    getActiveCategories: builder.query<GetCategoriesResponse, void>({
      query: () => ({
        url: "/admin/category/active",
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Category"],
    }),
    upadteCategoryStatus: builder.mutation<unknown, string>({
      query: (categoryId) => ({
        url: `/admin/category/${categoryId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Category"],
    }),
    createCategory: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/admin/category",
        method: "POST",
        body: formData,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Category"],
    }),

    getCategoryById: builder.query<unknown, string>({
      query: (categoryId) => ({
        url: `/admin/category/${categoryId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Category"],
    }),

    updateCategory: builder.mutation<
      unknown,
      { categoryId: string; formData: FormData }
    >({
      query: ({ categoryId, formData }) => ({
        url: `/admin/category/${categoryId}`,
        method: "PUT",
        body: formData,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Category"],
    }),

    deleteCategory: builder.mutation<unknown, string>({
      query: (categoryId: string) => ({
        url: `/admin/category/${categoryId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetActiveCategoriesQuery,
  useUpadteCategoryStatusMutation,
  useCreateCategoryMutation,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
