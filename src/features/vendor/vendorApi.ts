import { baseApi } from "../../store/api/baseApi";
import type {
  CreateVendorPayload,
  GetActiveVendorsResponse,
  GetVendorByIdResponse,
  GetVendorsParams,
  GetVendorsResponse,
  UpdateVendorRequest,
  UpdateVendorResponse,
  UpdateVendorStatusRequest,
  UpdateVendorVerificationRequest,
} from "./vendorTypes";

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchVendors: builder.query<GetVendorsResponse, GetVendorsParams>({
      query: ({
        page,
        limit,
        search,
        status,
        category,
        isVendorVerified,
        isAvailableNow,
        sortBy,
        sortOrder,
      }) => {
        const params = new URLSearchParams();

        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (status !== undefined) params.set("status", String(status));
        if (category) params.set("category", category);
        if (isVendorVerified !== undefined)
          params.set("isVendorVerified", String(isVendorVerified));
        if (isAvailableNow !== undefined)
          params.set("isAvailableNow", String(isAvailableNow));
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        const qs = params.toString();

        return {
          url: `/admin/vendors${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    fetchActiveVendorsList: builder.query<GetActiveVendorsResponse, void>({
      query: () => ({
        url: "/admin/vendors/active-list",
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    fetchVendorById: builder.query<GetVendorByIdResponse, string>({
      query: (userId) => ({
        url: `/admin/vendors/${userId}`,
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    createVendor: builder.mutation<UpdateVendorResponse, CreateVendorPayload>({
      query: (payload) => ({
        url: "/admin/vendors",
        method: "POST",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendor: builder.mutation<UpdateVendorResponse, UpdateVendorRequest>({
      query: ({ userId, payload }) => ({
        url: `/admin/vendors/${userId}`,
        method: "PUT",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendorStatus: builder.mutation<
      UpdateVendorResponse,
      UpdateVendorStatusRequest
    >({
      query: ({ userId, payload }) => ({
        url: `/admin/vendors/${userId}/status`,
        method: "PATCH",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendorVerification: builder.mutation<
      UpdateVendorResponse,
      UpdateVendorVerificationRequest
    >({
      query: ({ userId, payload }) => ({
        url: `/admin/vendors/${userId}/verify`,
        method: "PATCH",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    deleteVendor: builder.mutation<unknown, string>({
      query: (venderId: string) => ({
        url: `/admin/vendors/${venderId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Vendor"],
    }),
  }),
});

export const {
  useFetchVendorsQuery,
  useFetchActiveVendorsListQuery,
  useFetchVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useUpdateVendorStatusMutation,
  useUpdateVendorVerificationMutation,
  useDeleteVendorMutation,
} = vendorApi;
