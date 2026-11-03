export interface WalletSettings {
  _id: string;
  key: string;
  enabled: boolean;
  min_topup: number;
  max_topup: number;
  max_balance: number;
  quick_topup_amounts?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: Pagination;
}

// Responses
export type GetWalletSettingsResponse = ApiResponse<WalletSettings[]>;
export type GetWalletSettingsByIdResponse = ApiResponse<WalletSettings>;
export type CreateWalletSettingsResponse = ApiResponse<WalletSettings>;
export type UpdateWalletSettingsResponse = ApiResponse<WalletSettings>;
export type SetDefaultWalletSettingsResponse = ApiResponse<WalletSettings>;
export type ToggleWalletSettingsStatusResponse = ApiResponse<WalletSettings>;
export type DeleteWalletSettingsResponse = ApiResponse<null>;

// Query Params
export interface GetWalletSettingsParams {
  page?: number;
  limit?: number;
  key?: string;
  enabled?: boolean;
}

// Payloads
export interface CreateWalletSettingsPayload {
  min_topup: number;
  max_topup: number;
  max_balance: number;
  quick_topup_amounts: number[];
  enabled: boolean;
}

export interface UpdateWalletSettingsPayload {
  walletSettingsId: string;
  data: Partial<{
    min_topup: number;
    max_topup: number;
    max_balance: number;
    quick_topup_amounts: number[];
    enabled: boolean;
  }>;
}
