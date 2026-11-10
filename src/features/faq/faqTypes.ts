export type FaqStatus = "active" | "inactive";

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  status: FaqStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FaqPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FaqApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: FaqPagination;
}

// Request Params & Payloads

export interface FetchFaqsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: FaqStatus;
}

export interface CreateFaqPayload {
  question: string;
  answer: string;
}

export interface UpdateFaqPayload {
  faqId: string;
  question?: string;
  answer?: string;
  status?: FaqStatus;
}

// Response Types

export interface FetchFaqsResponse extends FaqApiResponse<Faq[]> {
  pagination: FaqPagination;
}

export type GetFaqByIdResponse = FaqApiResponse<Faq>;
export type CreateFaqResponse = FaqApiResponse<Faq>;
export type UpdateFaqResponse = FaqApiResponse<Faq>;
export type ToggleFaqStatusResponse = FaqApiResponse<Faq>;
export type DeleteFaqResponse = FaqApiResponse<Faq | null>;
