import { baseApi } from "../../store/api/baseApi";
import type {
  FetchBannerListParams,
  FetchBannerListResponse,
  GetBannerByIdResponse,
  CreateBannerResponse,
  CreateBannerPayload,
  UpdateBannerPayload,
  UpdateBannerResponse,
  ToggleBannerStatusResponse,
  DeleteBannerResponse,
} from "./bannerTypes";

const createBannerFormData = (payload: Record<string, unknown>): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export const bannerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchBanners: builder.query<
      FetchBannerListResponse,
      FetchBannerListParams | undefined
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params) {
          if (params.page !== undefined)
            queryParams.set("page", String(params.page));
          if (params.limit !== undefined)
            queryParams.set("limit", String(params.limit));
          if (params.search?.trim())
            queryParams.set("search", params.search.trim());
          if (params.status !== undefined)
            queryParams.set("status", String(params.status));
          if (params.position) queryParams.set("position", params.position);
          if (params.device_type)
            queryParams.set("device_type", params.device_type);
          if (params.upload_area)
            queryParams.set("upload_area", params.upload_area);
          if (params.store_id) queryParams.set("store_id", params.store_id);
        }

        const qs = queryParams.toString();

        return {
          url: `/vendor/banner${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Banner"],
    }),

    getBannerById: builder.query<GetBannerByIdResponse, string>({
      query: (bannerId) => ({
        url: `/vendor/banner/${bannerId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Banner"],
    }),

    createBanner: builder.mutation<
      CreateBannerResponse,
      CreateBannerPayload | FormData
    >({
      query: (body) => ({
        url: "/vendor/banner",
        method: "POST",
        body:
          body instanceof FormData
            ? body
            : createBannerFormData(body as unknown as Record<string, unknown>),
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Banner"],
    }),

    updateBanner: builder.mutation<UpdateBannerResponse, UpdateBannerPayload>({
      query: ({ bannerId, ...payload }) => ({
        url: `/vendor/banner/${bannerId}`,
        method: "PUT",
        body: createBannerFormData(
          payload as unknown as Record<string, unknown>,
        ),
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Banner"],
    }),

    toggleBannerStatus: builder.mutation<ToggleBannerStatusResponse, string>({
      query: (bannerId) => ({
        url: `/vendor/banner/${bannerId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Banner"],
    }),

    deleteBanner: builder.mutation<DeleteBannerResponse, string>({
      query: (bannerId) => ({
        url: `/vendor/banner/${bannerId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Banner"],
    }),
  }),
});

export const {
  useFetchBannersQuery,
  useGetBannerByIdQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useToggleBannerStatusMutation,
  useDeleteBannerMutation,
} = bannerApi;
