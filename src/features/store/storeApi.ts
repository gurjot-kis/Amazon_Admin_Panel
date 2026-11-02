import { baseApi } from "../../store/api/baseApi";

import type {
  FetchAllStoresParams,
  FetchAllStoresResponse,
  GetStoreByIdResponse,
  UpdateStoreStatusParams,
  UpdateStoreStatusResponse,
  UpdateStoreVerificationParams,
  UpdateStoreVerificationResponse,
  FetchMyStoresParams,
  FetchMyStoresResponse,
  CreateStoreResponse,
  GetMyStoreByIdResponse,
  UpdateStoreResponse,
  SetDefaultStoreResponse,
  ToggleStoreStatusResponse,
  DeleteStoreResponse,
  UpdateStorePayload,
  FetchVendorActiveStoresResponse,
} from "./storeTypes";

// Convert a store payload to multipart FormData.
// Use this for store logo and banner uploads.
const createStoreFormData = (payload: Record<string, unknown>): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "boolean") {
      formData.append(key, String(value));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export const storeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== ADMIN ROUTES ====================

    fetchAllStores: builder.query<FetchAllStoresResponse, FetchAllStoresParams>(
      {
        query: ({
          page,
          limit,
          search,
          status,
          verification_status,
          vendor_id,
        } = {}) => {
          const params = new URLSearchParams();

          if (page !== undefined) params.set("page", String(page));
          if (limit !== undefined) params.set("limit", String(limit));
          if (search?.trim()) params.set("search", search.trim());
          if (status) params.set("status", status);
          if (verification_status) {
            params.set("verification_status", verification_status);
          }
          if (vendor_id) params.set("vendor_id", vendor_id);

          const qs = params.toString();

          return {
            url: `/admin/store${qs ? `?${qs}` : ""}`,
            method: "GET",
          };
        },
        extraOptions: { requiresAuth: true },
        providesTags: ["Store"],
      },
    ),

    fetchStoresByVendorId: builder.query<
      FetchVendorActiveStoresResponse,
      string
    >({
      query: (vendorId) => ({
        url: `/admin/store/${vendorId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Store"],
    }),

    getStoreById: builder.query<GetStoreByIdResponse, string>({
      query: (storeId) => ({
        url: `/admin/store/${storeId}/details`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Store"],
    }),

    updateStoreVerification: builder.mutation<
      UpdateStoreVerificationResponse,
      UpdateStoreVerificationParams
    >({
      query: ({ storeId, verification_status, rejection_reason }) => ({
        url: `/admin/store/${storeId}/verification`,
        method: "PATCH",
        body: {
          verification_status,
          ...(rejection_reason !== undefined && {
            rejection_reason,
          }),
        },
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    updateStoreStatus: builder.mutation<
      UpdateStoreStatusResponse,
      UpdateStoreStatusParams
    >({
      query: ({ storeId, status }) => ({
        url: `/admin/store/${storeId}/status`,
        method: "PATCH",
        body: { status },
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    // ==================== VENDOR ROUTES ====================

    fetchMyStores: builder.query<FetchMyStoresResponse, FetchMyStoresParams>({
      query: ({ page, limit, search, status, verification_status } = {}) => {
        const params = new URLSearchParams();

        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search?.trim()) params.set("search", search.trim());
        if (status) params.set("status", status);
        if (verification_status) {
          params.set("verification_status", verification_status);
        }

        const qs = params.toString();

        return {
          url: `/vendor/store${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Store"],
    }),

    fetchVendorActiveStores: builder.query<
      FetchVendorActiveStoresResponse,
      void
    >({
      query: () => ({
        url: "/vendor/store/my/active-list",
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Store"],
    }),

    createStore: builder.mutation<CreateStoreResponse, FormData>({
      query: (formData) => ({
        url: "/vendor/store",
        method: "POST",
        body: formData,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    getMyStoreById: builder.query<GetMyStoreByIdResponse, string>({
      query: (storeId) => ({
        url: `/vendor/store/${storeId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Store"],
    }),

    updateMyStore: builder.mutation<UpdateStoreResponse, UpdateStorePayload>({
      query: ({ storeId, ...payload }) => ({
        url: `/vendor/store/${storeId}`,
        method: "PUT",
        body: createStoreFormData(payload as Record<string, unknown>),
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    setDefaultStore: builder.mutation<SetDefaultStoreResponse, string>({
      query: (storeId) => ({
        url: `/vendor/store/${storeId}/default`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    toggleMyStoreStatus: builder.mutation<ToggleStoreStatusResponse, string>({
      query: (storeId) => ({
        url: `/vendor/store/${storeId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    deleteMyStore: builder.mutation<DeleteStoreResponse, string>({
      query: (storeId) => ({
        url: `/vendor/store/${storeId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),
  }),
});

export const {
  // Admin hooks
  useFetchAllStoresQuery,
  useFetchStoresByVendorIdQuery,
  useGetStoreByIdQuery,
  useUpdateStoreVerificationMutation,
  useUpdateStoreStatusMutation,

  // Vendor hooks
  useFetchMyStoresQuery,
  useFetchVendorActiveStoresQuery,
  useCreateStoreMutation,
  useGetMyStoreByIdQuery,
  useUpdateMyStoreMutation,
  useSetDefaultStoreMutation,
  useToggleMyStoreStatusMutation,
  useDeleteMyStoreMutation,
} = storeApi;
