import { baseApi } from '../../store/api/baseApi'
import type {
  GetOrderByIdResponse,
  GetOrdersParams,
  GetOrdersResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse
} from './orderTypes'

export const orderApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getAllOrders: builder.query<GetOrdersResponse, GetOrdersParams>({
      query: ({ page, limit, status, search }) => {
        const params = new URLSearchParams()
        if (page !== undefined) params.set('page', String(page))
        if (limit !== undefined) params.set('limit', String(limit))
        if (status) params.set('status', status)
        if (search?.trim()) params.set('search', search.trim())

        const qs = params.toString()
        return {
          url: `/admin/order/all-orders${qs ? `?${qs}` : ''}`,
          method: 'GET'
        }
      },
      extraOptions: { requiresAuth: true },
      providesTags: ['Order']
    }),

    getOrderById: builder.query<GetOrderByIdResponse, string>({
      query: orderId => ({
        url: `/admin/order/${orderId}`,
        method: 'GET'
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ['Order']
    }),

    updateOrderStatus: builder.mutation<
      UpdateOrderStatusResponse,
      UpdateOrderStatusRequest
    >({
      query: ({ orderId, status }) => ({
        url: `/admin/order/${orderId}/status`,
        method: 'PATCH',
        body: { status }
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ['Order']
    })
  })
})

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation
} = orderApi
