import { baseApi } from "../../store/api/baseApi";

import type { GetProductsParams, GetProductsResponse } from "./productTypes";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<GetProductsResponse, GetProductsParams>({
      query: ({ page, limit, search, category_id, status }) => {
        const params = new URLSearchParams();

        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (category_id) params.set("category_id", category_id);
        if (status) params.set("status", status);

        const qs = params.toString();

        return {
          url: `/admin/product/list${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Product"],
    }),
  }),
});

export const { useGetProductsQuery } = productApi;
