import { baseApi } from "../../store/api/baseApi";
import type {
  CreateWalletSettingsPayload,
  CreateWalletSettingsResponse,
  DeleteWalletSettingsResponse,
  GetWalletSettingsByIdResponse,
  GetWalletSettingsParams,
  GetWalletSettingsResponse,
  SetDefaultWalletSettingsResponse,
  ToggleWalletSettingsStatusResponse,
  UpdateWalletSettingsPayload,
  UpdateWalletSettingsResponse,
} from "./walletSettingsTypes";

export const walletSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletSettings: builder.query<
      GetWalletSettingsResponse,
      GetWalletSettingsParams | void
    >({
      query: (arg) => {
        const params = arg || {};
        const queryParams = new URLSearchParams();

        if (params.page !== undefined) {
          queryParams.set("page", String(params.page));
        }

        if (params.limit !== undefined) {
          queryParams.set("limit", String(params.limit));
        }

        const qs = queryParams.toString();

        return {
          url: `/admin/wallet-settings${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },

      extraOptions: {
        requiresAuth: true,
      },

      providesTags: ["WalletSettings"],
    }),

    getWalletSettingsById: builder.query<GetWalletSettingsByIdResponse, string>(
      {
        query: (walletSettingsId) => ({
          url: `/admin/wallet-settings/${walletSettingsId}`,
          method: "GET",
        }),

        extraOptions: {
          requiresAuth: true,
        },

        providesTags: ["WalletSettings"],
      },
    ),

    createWalletSettings: builder.mutation<
      CreateWalletSettingsResponse,
      CreateWalletSettingsPayload
    >({
      query: (data) => ({
        url: "/admin/wallet-settings",
        method: "POST",
        body: data,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["WalletSettings"],
    }),

    updateWalletSettings: builder.mutation<
      UpdateWalletSettingsResponse,
      UpdateWalletSettingsPayload
    >({
      query: ({ walletSettingsId, data }) => ({
        url: `/admin/wallet-settings/${walletSettingsId}`,
        method: "PUT",
        body: data,
      }),

      extraOptions: {
        requiresAuth: true,
      },

      invalidatesTags: ["WalletSettings"],
    }),

    setDefaultWalletSettings: builder.mutation<
      SetDefaultWalletSettingsResponse,
      string
    >({
      query: (walletSettingsId) => ({
        url: `/admin/wallet-settings/${walletSettingsId}/set-default`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["WalletSettings"],
    }),

    toggleWalletSettingsStatus: builder.mutation<
      ToggleWalletSettingsStatusResponse,
      string
    >({
      query: (walletSettingsId) => ({
        url: `/admin/wallet-settings/${walletSettingsId}/toggle-status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["WalletSettings"],
    }),

    deleteWalletSettings: builder.mutation<
      DeleteWalletSettingsResponse,
      string
    >({
      query: (walletSettingsId) => ({
        url: `/admin/wallet-settings/${walletSettingsId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["WalletSettings"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetWalletSettingsQuery,
  useGetWalletSettingsByIdQuery,
  useCreateWalletSettingsMutation,
  useUpdateWalletSettingsMutation,
  useSetDefaultWalletSettingsMutation,
  useToggleWalletSettingsStatusMutation,
  useDeleteWalletSettingsMutation,
} = walletSettingsApi;
