import { baseApi } from "../../store/api/baseApi";
import type {
  GetAdminProfileResponse,
  GetVendorProfileResponse,
  UpdateAdminProfilePayload,
  UpdateAdminProfileResponse,
  UpdateVendorProfilePayload,
  UpdateVendorProfileResponse,
} from "./profileTypes";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin Profile
    getAdminProfile: builder.query<GetAdminProfileResponse, void>({
      query: () => ({
        url: "/admin/profile",
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
      providesTags: ["Profile"],
    }),

    updateAdminProfile: builder.mutation<
      UpdateAdminProfileResponse,
      UpdateAdminProfilePayload
    >({
      query: (payload) => ({
        url: "/admin/profile",
        method: "PATCH",
        body: payload,
      }),
      extraOptions: {
        requiresAuth: true,
      },
      invalidatesTags: ["Profile"],
    }),

    // Vendor Profile
    getVendorProfile: builder.query<GetVendorProfileResponse, void>({
      query: () => ({
        url: "/vendor/profile",
        method: "GET",
      }),
      extraOptions: {
        requiresAuth: true,
      },
      providesTags: ["Profile"],
    }),

    updateVendorProfile: builder.mutation<
      UpdateVendorProfileResponse,
      UpdateVendorProfilePayload
    >({
      query: (payload) => ({
        url: "/vendor/profile",
        method: "PATCH",
        body: payload,
      }),
      extraOptions: {
        requiresAuth: true,
      },
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
} = profileApi;
