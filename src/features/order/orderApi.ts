import { baseApi } from "../../store/api/baseApi";
import type {
  GetAdminOrderCountParams,
  GetAdminOrderCountResponse,
  GetOrderByIdResponse,
  GetOrdersParams,
  GetOrdersResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
} from "./orderTypes";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query<GetOrdersResponse, GetOrdersParams>({
      query: ({ page, limit, status, search, store_id }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        if (store_id) params.set("store_id", store_id);

        const qs = params.toString();
        return {
          url: `/vendor/orders${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Order"],
    }),

    getOrderById: builder.query<GetOrderByIdResponse, string>({
      query: (orderId) => ({
        url: `/vendor/orders/${orderId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Order"],
    }),

    updateOrderStatus: builder.mutation<
      UpdateOrderStatusResponse,
      UpdateOrderStatusRequest
    >({
      query: ({ orderId, status }) => ({
        url: `/vendor/orders/${orderId}/status`,
        method: "PATCH",
        body: { status },
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Order"],
    }),

    getAdminOrderCount: builder.query<
      GetAdminOrderCountResponse,
      GetAdminOrderCountParams
    >({
      query: ({ search, vendor_id, page, limit } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (vendor_id) params.set("vendor_id", vendor_id);
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));

        const qs = params.toString();

        return {
          url: `/admin/order/count${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Order"],
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useGetAdminOrderCountQuery,
} = orderApi;
