import { baseApi } from "../../store/api/baseApi";
import type {
  CreateVariantOptionPayload,
  CreateVariantTypePayload,
  GetVariantOptionsParams,
  GetVariantOptionsResponse,
  GetVariantTypesParams,
  GetVariantTypesResponse,
  UpdateVariantOptionPayload,
} from "./variantTypes";

export const variantTypeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------- Variant Type APIs -----------------------------
    getVariantTypes: builder.query<
      GetVariantTypesResponse,
      GetVariantTypesParams
    >({
      query: ({ page, limit, search, status }) => {
        const params = new URLSearchParams();

        if (page !== undefined) {
          params.set("page", String(page));
        }

        if (limit !== undefined) {
          params.set("limit", String(limit));
        }

        if (search?.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        const qs = params.toString();

        return {
          url: `/admin/variant-types${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["VariantType"],
    }),

    getVariantTypeById: builder.query<unknown, string>({
      query: (variantTypeId) => ({
        url: `/admin/variant-types/${variantTypeId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["VariantType"],
    }),

    createVariantType: builder.mutation<unknown, CreateVariantTypePayload>({
      query: (data) => ({
        url: "/admin/variant-types",
        method: "POST",
        body: data,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantType"],
    }),

    updateVariantTypeStatus: builder.mutation<unknown, string>({
      query: (variantTypeId) => ({
        url: `/admin/variant-types/${variantTypeId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantType"],
    }),

    updateVariantType: builder.mutation<
      unknown,
      {
        variantTypeId: string;
        data: CreateVariantTypePayload;
      }
    >({
      query: ({ variantTypeId, data }) => ({
        url: `/admin/variant-types/${variantTypeId}`,
        method: "PUT",
        body: data,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantType"],
    }),

    deleteVariantType: builder.mutation<unknown, string>({
      query: (variantTypeId) => ({
        url: `/admin/variant-types/${variantTypeId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantType"],
    }),

    // ----------------------- Variant Option APIs -----------------------
    getVariantOptions: builder.query<
      GetVariantOptionsResponse,
      GetVariantOptionsParams
    >({
      query: ({ page, limit, search, status, variant_type_id }) => {
        const params = new URLSearchParams();

        if (page !== undefined) {
          params.set("page", String(page));
        }

        if (limit !== undefined) {
          params.set("limit", String(limit));
        }

        if (search?.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        if (variant_type_id) {
          params.set("variant_type_id", variant_type_id);
        }

        const qs = params.toString();

        return {
          url: `/admin/variant-options${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: { requiresAuth: true },
      providesTags: ["VariantOption"],
    }),

    getVariantOptionById: builder.query<unknown, string>({
      query: (variantOptionId) => ({
        url: `/admin/variant-options/${variantOptionId}`,
        method: "GET",
      }),

      extraOptions: { requiresAuth: true },
      providesTags: ["VariantOption"],
    }),

    getVariantOptionsByType: builder.query<
      unknown,
      {
        variantTypeId: string;
        status?: "active" | "inactive";
      }
    >({
      query: ({ variantTypeId, status }) => {
        const params = new URLSearchParams();

        if (status) {
          params.set("status", status);
        }

        const qs = params.toString();

        return {
          url: `/admin/variant-options/by-type/${variantTypeId}${
            qs ? `?${qs}` : ""
          }`,
          method: "GET",
        };
      },

      extraOptions: { requiresAuth: true },
      providesTags: ["VariantOption"],
    }),

    createVariantOption: builder.mutation<unknown, CreateVariantOptionPayload>({
      query: (data) => ({
        url: "/admin/variant-options",
        method: "POST",
        body: data,
      }),

      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantOption"],
    }),

    updateVariantOption: builder.mutation<
      unknown,
      {
        variantOptionId: string;
        data: UpdateVariantOptionPayload;
      }
    >({
      query: ({ variantOptionId, data }) => ({
        url: `/admin/variant-options/${variantOptionId}`,
        method: "PUT",
        body: data,
      }),

      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantOption"],
    }),

    updateVariantOptionStatus: builder.mutation<unknown, string>({
      query: (variantOptionId) => ({
        url: `/admin/variant-options/${variantOptionId}/status`,
        method: "PATCH",
      }),

      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantOption"],
    }),

    deleteVariantOption: builder.mutation<unknown, string>({
      query: (variantOptionId) => ({
        url: `/admin/variant-options/${variantOptionId}`,
        method: "DELETE",
      }),

      extraOptions: { requiresAuth: true },
      invalidatesTags: ["VariantOption"],
    }),
  }),
});

export const {
  //variant type
  useGetVariantTypesQuery,
  useGetVariantTypeByIdQuery,
  useCreateVariantTypeMutation,
  useUpdateVariantTypeStatusMutation,
  useUpdateVariantTypeMutation,
  useDeleteVariantTypeMutation,

  //variant option
  useGetVariantOptionsQuery,
  useGetVariantOptionByIdQuery,
  useGetVariantOptionsByTypeQuery,
  useCreateVariantOptionMutation,
  useUpdateVariantOptionMutation,
  useUpdateVariantOptionStatusMutation,
  useDeleteVariantOptionMutation,
} = variantTypeApi;
