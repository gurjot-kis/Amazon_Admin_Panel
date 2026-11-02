import { baseApi } from "../../store/api/baseApi";
import type {
  CouponListResponse,
  CreateCouponPayload,
  GetCouponListParams,
  UpdateCouponPayload,
} from "./couponTypes";

export const couponApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //vendors
    getVendorCouponList: builder.query<CouponListResponse, GetCouponListParams>(
      {
        query: ({ page, limit, search, status, scope }) => {
          const params = new URLSearchParams();
          if (page != undefined) params.set("page", String(page));
          if (limit !== undefined) params.set("limit", String(limit));
          if (search !== undefined) params.set("search", search.trim());
          if (status !== undefined) params.set("status", String(status));
          if (scope !== undefined) params.set("scope", String(scope));

          const qs = params.toString();
          return {
            url: `/vendor/coupon${qs ? `?${qs}` : ""}`,
            method: "GET",
          };
        },
        extraOptions: { requiresAuth: true },
        providesTags: ["Coupon"],
      },
    ),

    getVenodrCouponById: builder.query({
      query: (couponId) => ({
        url: `/vendor/coupon/${couponId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Coupon"],
    }),

    createVendorCoupon: builder.mutation<unknown, CreateCouponPayload>({
      query: (payload) => ({
        url: "/vendor/coupon",
        method: "POST",
        body: payload,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    updateVendorCoupon: builder.mutation<
      unknown,
      { couponId: string; payload: UpdateCouponPayload }
    >({
      query: ({ couponId, payload }) => ({
        url: `/vendor/coupon/${couponId}`,
        method: "PUT",
        body: payload,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    updateVendorCouponStatus: builder.mutation<unknown, string>({
      query: (couponId) => ({
        url: `/vendor/coupon/${couponId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    deleteVendorCoupon: builder.mutation({
      query: (couponId: string) => ({
        url: `/vendor/coupon/${couponId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    uploadVendorCouponImage: builder.mutation<
      unknown,
      {
        couponId: string;
        image: File;
        coupon_image_type: "website" | "mobile";
      }
    >({
      query: ({ couponId, image, coupon_image_type }) => {
        const formData = new FormData();

        formData.append("coupon_image", image);
        formData.append("coupon_image_type", coupon_image_type);

        return {
          url: `/vendor/coupon/${couponId}/image`,
          method: "POST",
          body: formData,
        };
      },
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    //super admin
    getAdminCouponList: builder.query<CouponListResponse, GetCouponListParams>({
      query: ({ page, limit, search, status, scope }) => {
        const params = new URLSearchParams();
        if (page != undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search !== undefined) params.set("search", search.trim());
        if (status !== undefined) params.set("status", String(status));
        if (scope !== undefined) params.set("scope", String(scope));

        const qs = params.toString();
        return {
          url: `/admin/coupon${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Coupon"],
    }),

    createAdminCoupon: builder.mutation<unknown, CreateCouponPayload>({
      query: (payload) => ({
        url: "/admin/coupon",
        method: "POST",
        body: payload,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    getAdminCouponById: builder.query({
      query: (couponId) => ({
        url: `/admin/coupon/${couponId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Coupon"],
    }),

    updateAdminCoupon: builder.mutation<
      unknown,
      { couponId: string; payload: UpdateCouponPayload }
    >({
      query: ({ couponId, payload }) => ({
        url: `/admin/coupon/${couponId}`,
        method: "PUT",
        body: payload,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    updateAdminCouponStatus: builder.mutation<unknown, string>({
      query: (couponId) => ({
        url: `/admin/coupon/${couponId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    deleteAdminCoupon: builder.mutation({
      query: (couponId: string) => ({
        url: `/admin/coupon/${couponId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    uploadAdminCouponImage: builder.mutation<
      unknown,
      {
        couponId: string;
        image: File;
        coupon_image_type: "website" | "mobile";
      }
    >({
      query: ({ couponId, image, coupon_image_type }) => {
        const formData = new FormData();

        formData.append("coupon_image", image);
        formData.append("coupon_image_type", coupon_image_type);

        return {
          url: `/admin/coupon/${couponId}/image`,
          method: "POST",
          body: formData,
        };
      },
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),
  }),
});

export const {
  useGetVendorCouponListQuery,
  useGetVenodrCouponByIdQuery,
  useCreateVendorCouponMutation,
  useUpdateVendorCouponStatusMutation,
  useUpdateVendorCouponMutation,
  useDeleteVendorCouponMutation,
  useUploadVendorCouponImageMutation,

  useGetAdminCouponListQuery,
  useCreateAdminCouponMutation,
  useGetAdminCouponByIdQuery,
  useUpdateAdminCouponMutation,
  useUpdateAdminCouponStatusMutation,
  useDeleteAdminCouponMutation,
  useUploadAdminCouponImageMutation,
} = couponApi;
