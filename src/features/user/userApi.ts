import { baseApi } from "../../store/api/baseApi";
import type {
  GetUsersParams,
  GetUsersResponse,
  UpdateUserStatusPayload,
  UpdateUserStatusResponse,
} from "./userTypes";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<GetUsersResponse, GetUsersParams>({
      query: ({ page, limit, status, search }) => {
        const params = new URLSearchParams();

        if (page !== undefined) {
          params.set("page", String(page));
        }

        if (limit !== undefined) {
          params.set("limit", String(limit));
        }

        if (status !== undefined) {
          params.set("status", String(status));
        }

        if (search) {
          params.set("search", search);
        }
        const qs = params.toString();

        return {
          url: `/users${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: {
        requiresAuth: true,
      },
      providesTags: ["User"],
    }),
    updateUserStatus: builder.mutation<
      UpdateUserStatusResponse,
      {
        userId: string;
        payload: UpdateUserStatusPayload;
      }
    >({
      query: ({ userId, payload }) => ({
        url: `/users/${userId}/status`,
        method: "PATCH",
        body: payload,
      }),
      extraOptions: {
        requiresAuth: true,
      },
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useGetAllUsersQuery, useUpdateUserStatusMutation } = userApi;
