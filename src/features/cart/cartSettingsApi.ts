import { baseApi } from "../../store/api/baseApi";
import type {
  GetCartSettingsParams,
  GetCartSettingsResponse,
  GetCartSettingsByIdResponse,
  CreateCartSettingsPayload,
  CreateCartSettingsResponse,
  UpdateCartSettingsPayload,
  UpdateCartSettingsResponse,
} from "./cartSettingsTypes";

export const cartSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCartSettings: builder.query<
      GetCartSettingsResponse,
      GetCartSettingsParams
    >({
      query: ({ page, limit, user_id, role } = {}) => {
        const params = new URLSearchParams();

        if (page !== undefined) {
          params.set("page", String(page));
        }

        if (limit !== undefined) {
          params.set("limit", String(limit));
        }

        if (user_id?.trim()) {
          params.set("user_id", user_id.trim());
        }

        if (role?.trim()) {
          params.set("role", role.trim());
        }

        const qs = params.toString();

        return {
          url: `/admin/cart-settings/${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["CartSettings"],
    }),

    getCartSettingsById: builder.query<GetCartSettingsByIdResponse, string>({
      query: (cartSettingsId) => ({
        url: `/admin/cart-settings/${cartSettingsId}`,
        method: "GET",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["CartSettings"],
    }),

    createCartSettings: builder.mutation<
      CreateCartSettingsResponse,
      CreateCartSettingsPayload
    >({
      query: (data) => ({
        url: "/admin/cart-settings/",
        method: "POST",
        body: data,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["CartSettings"],
    }),

    updateCartSettings: builder.mutation<
      UpdateCartSettingsResponse,
      UpdateCartSettingsPayload
    >({
      query: ({ cartSettingsId, data }) => ({
        url: `/admin/cart-settings/${cartSettingsId}`,
        method: "PUT",
        body: data,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["CartSettings"],
    }),

    deleteCartSettings: builder.mutation<unknown, string>({
      query: (cartSettingsId) => ({
        url: `/admin/cart-settings/${cartSettingsId}`,
        method: "DELETE",
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["CartSettings"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetCartSettingsQuery,
  useGetCartSettingsByIdQuery,
  useCreateCartSettingsMutation,
  useUpdateCartSettingsMutation,
  useDeleteCartSettingsMutation,
} = cartSettingsApi;
