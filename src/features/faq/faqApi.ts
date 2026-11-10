import { baseApi } from "../../store/api/baseApi";
import type {
  FetchFaqsParams,
  FetchFaqsResponse,
  GetFaqByIdResponse,
  CreateFaqPayload,
  CreateFaqResponse,
  UpdateFaqPayload,
  UpdateFaqResponse,
  DeleteFaqResponse,
  ToggleFaqStatusResponse,
} from "./faqTypes";

export const faqApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== ADMIN FAQ ROUTES ====================

    fetchFaqs: builder.query<FetchFaqsResponse, FetchFaqsParams | void>({
      query: ({ page, limit, search, status }: FetchFaqsParams = {}) => {
        const queryParams = new URLSearchParams();

        if (page !== undefined) queryParams.set("page", String(page));
        if (limit !== undefined) queryParams.set("limit", String(limit));
        if (search?.trim()) queryParams.set("search", search.trim());
        if (status) queryParams.set("status", status);

        const qs = queryParams.toString();

        return {
          url: `/admin/faq${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Faq"],
    }),

    getFaqById: builder.query<GetFaqByIdResponse, string>({
      query: (faqId) => ({
        url: `/admin/faq/${faqId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Faq"],
    }),

    createFaq: builder.mutation<CreateFaqResponse, CreateFaqPayload>({
      query: (body) => ({
        url: "/admin/faq",
        method: "POST",
        body,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Faq"],
    }),

    updateFaq: builder.mutation<UpdateFaqResponse, UpdateFaqPayload>({
      query: ({ faqId, ...body }) => ({
        url: `/admin/faq/${faqId}`,
        method: "PATCH",
        body,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Faq"],
    }),

    toggleFaqStatus: builder.mutation<ToggleFaqStatusResponse, string>({
      query: (faqId) => ({
        url: `/admin/faq/${faqId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Faq"],
    }),

    deleteFaq: builder.mutation<DeleteFaqResponse, string>({
      query: (faqId) => ({
        url: `/admin/faq/${faqId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Faq"],
    }),
  }),
});

export const {
  useFetchFaqsQuery,
  useGetFaqByIdQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useToggleFaqStatusMutation,
  useDeleteFaqMutation,
} = faqApi;
