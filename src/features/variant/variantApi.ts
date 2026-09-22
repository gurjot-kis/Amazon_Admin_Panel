import { baseApi } from "../../store/api/baseApi";
import type {
  CreateVariantTypePayload,
  GetVariantTypesParams,
  GetVariantTypesResponse,
} from "./variantTypes";

export const variantTypeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetVariantTypesQuery,
  useGetVariantTypeByIdQuery,
  useCreateVariantTypeMutation,
  useUpdateVariantTypeStatusMutation,
  useUpdateVariantTypeMutation,
  useDeleteVariantTypeMutation,
} = variantTypeApi;
