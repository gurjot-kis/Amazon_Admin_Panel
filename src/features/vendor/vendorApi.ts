import { baseApi } from "../../store/api/baseApi";
import type {
  AddVendorServicesPayload,
  AddVendorServicesResponse,
  AddVendorSlotPayload,
  AddVendorSlotResponse,
  CreateVendorPayload,
  GetVendorByIdResponse,
  GetVendorServicesParams,
  GetVendorServicesResponse,
  GetVendorSlotByIdResponse,
  GetVendorSlotsParams,
  GetVendorSlotsResponse,
  GetVendorsParams,
  GetVendorsResponse,
  ToggleVendorServiceResponse,
  UpdateVendorAvailabilityRequest,
  UpdateVendorRequest,
  UpdateVendorResponse,
  UpdateVendorSlotAvailabilityResponse,
  UpdateVendorSlotRequest,
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
          url: `/vendors${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    fetchVendorById: builder.query<GetVendorByIdResponse, string>({
      query: (userId) => ({
        url: `/vendors/${userId}`,
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["Vendor"],
    }),

    createVendor: builder.mutation<UpdateVendorResponse, CreateVendorPayload>({
      query: (payload) => ({
        url: "/vendors",
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
        url: `/vendors/${userId}`,
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
        url: `/vendors/${userId}/status`,
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
        url: `/vendors/${userId}/verify`,
        method: "PATCH",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["Vendor"],
    }),

    updateVendorAvailability: builder.mutation<
      UpdateVendorResponse,
      UpdateVendorAvailabilityRequest
    >({
      query: ({ userId, payload }) => ({
        url: `/vendors/${userId}/availability`,
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
        url: `/vendors/${venderId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Vendor"],
    }),

    // vendor slot apis
    addVendorSlot: builder.mutation<
      AddVendorSlotResponse,
      AddVendorSlotPayload
    >({
      query: (payload) => ({
        url: "/vendor/vendor-slot",
        method: "POST",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["VendorSlot"],
    }),

    getMyVendorSlots: builder.query<
      GetVendorSlotsResponse,
      GetVendorSlotsParams
    >({
      query: ({ page, limit, category_id, status, date }) => {
        const queryParams = new URLSearchParams();

        if (page !== undefined) queryParams.set("page", String(page));
        if (limit !== undefined) queryParams.set("limit", String(limit));
        if (category_id) queryParams.set("category_id", category_id);
        if (status) queryParams.set("status", status);
        if (date) queryParams.set("date", date);

        const qs = queryParams.toString();

        return {
          url: `vendor/vendor-slot/${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["VendorSlot"],
    }),

    getVendorSlotById: builder.query<GetVendorSlotByIdResponse, string>({
      query: (slotId) => ({
        url: `/vendor/vendor-slot/${slotId}`,
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["VendorSlot"],
    }),

    updateVendorSlot: builder.mutation<
      AddVendorSlotResponse,
      UpdateVendorSlotRequest
    >({
      query: ({ slotId, payload }) => ({
        url: `/vendor/vendor-slot/${slotId}`,
        method: "PUT",
        body: payload,
      }),
      extraOptions: {
        requiresAuth: true,
      },
      invalidatesTags: ["VendorSlot"],
    }),

    updateVendorSlotAvailability: builder.mutation<
      UpdateVendorSlotAvailabilityResponse,
      string
    >({
      query: (slotId) => ({
        url: `/vendor/vendor-slot/${slotId}`,
        method: "PATCH",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["VendorSlot"],
    }),

    //vedor service
    getVendorServices: builder.query<
      GetVendorServicesResponse,
      GetVendorServicesParams
    >({
      query: ({ page, limit, search, status }) => {
        const queryParams = new URLSearchParams();

        if (page !== undefined) {
          queryParams.set("page", String(page));
        }

        if (limit !== undefined) {
          queryParams.set("limit", String(limit));
        }

        if (search?.trim()) {
          queryParams.set("search", search.trim());
        }

        if (status) {
          queryParams.set("status", status);
        }

        const qs = queryParams.toString();

        return {
          url: `/vendor/service${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["VendorService"],
    }),

    getAllVendorServices: builder.query<GetVendorServicesResponse, void>({
      query: () => ({
        url: "/vendor/service/all-services",
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["VendorService"],
    }),

    toggleVendorService: builder.mutation<ToggleVendorServiceResponse, string>({
      query: (serviceId) => ({
        url: `/vendor/service/${serviceId}`,
        method: "PATCH",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["VendorService"],
    }),

    addVendorServices: builder.mutation<
      AddVendorServicesResponse,
      AddVendorServicesPayload
    >({
      query: (payload) => ({
        url: "/vendor/service",
        method: "POST",
        body: payload,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["VendorService"],
    }),

    deleteVendorService: builder.mutation<void, string>({
      query: (service_id) => ({
        url: `/vendor/service/${service_id}`,
        method: "DELETE",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["VendorService"],
    }),
  }),
});

export const {
  useFetchVendorsQuery,
  useFetchVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useUpdateVendorStatusMutation,
  useUpdateVendorVerificationMutation,
  useUpdateVendorAvailabilityMutation,
  useDeleteVendorMutation,
  //vendor slot
  useGetMyVendorSlotsQuery,
  useGetVendorSlotByIdQuery,
  useAddVendorSlotMutation,
  useUpdateVendorSlotMutation,
  useUpdateVendorSlotAvailabilityMutation,
  //vendor service
  useGetVendorServicesQuery,
  useGetAllVendorServicesQuery,
  useToggleVendorServiceMutation,
  useAddVendorServicesMutation,
  useDeleteVendorServiceMutation,
} = vendorApi;
