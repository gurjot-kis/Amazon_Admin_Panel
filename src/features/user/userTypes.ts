export type UserStatus = 0 | 1;

export interface User {
  user_id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: UserStatus;
  profilePicture?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
}

export interface UserPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetUsersResponse {
  success: boolean;
  code: number;
  message: string;
  data: User[];
  pagination: UserPagination;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
}

export interface UpdateUserStatusResponse {
  success: boolean;
  code: number;
  message: string;
  data: User;
}
