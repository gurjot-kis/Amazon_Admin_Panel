// ============================================================
// Vendor Models / Details
// ============================================================

export interface VendorCurrentLocation {
  type: string;
  coordinates: number[];
}

export interface VendorCateoryDetails {
  _id: string;
  name: string;
  image: string;
}

export interface Vendor {
  _id: string;
  user_id: string;
  fullName: string;
  profilePicture: string;
  email: string;
  phone: string;
  address: string;
  code: string;
  gst_number: string;
  status: number;
  vendorCategories: string[];
  category: VendorCateoryDetails[];
  serviceableAreas: string[];
  currentLocation: VendorCurrentLocation;
  isAvailableNow: boolean;
  isVendorVerified: boolean;
  createdAt: string;
}

export interface VendorDetails {
  fullName?: string;
  user_id: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  vendorCategories: string[];
  serviceableAreas: {
    pincode: string;
  }[];
  createdAt: string;
}

export interface VendorPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================
// Vendor Payloads / Request Params
// ============================================================

export interface CreateVendorPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface UpdateVendorPayload {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  vendorCategories?: string[];
  serviceableAreas?: {
    pincode: string;
  }[];
}

export interface UpdateVendorRequest {
  userId: string;
  payload: UpdateVendorPayload;
}

export interface UpdateVendorStatusPayload {
  status: number;
}

export interface UpdateVendorStatusRequest {
  userId: string;
  payload: UpdateVendorStatusPayload;
}

export interface UpdateVendorVerificationPayload {
  isVendorVerified: boolean;
}

export interface UpdateVendorVerificationRequest {
  userId: string;
  payload: UpdateVendorVerificationPayload;
}

export interface UpdateVendorAvailabilityPayload {
  isAvailableNow: boolean;
}

export interface UpdateVendorAvailabilityRequest {
  userId: string;
  payload: UpdateVendorAvailabilityPayload;
}

export interface GetVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  category?: string;
  isVendorVerified?: boolean;
  isAvailableNow?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetVendorByIdParams {
  userId: string;
}

export interface DeleteVendorParams {
  vendorId: string;
}

export interface GetVendorSlotByIdParams {
  slotId: string;
}

export interface UpdateVendorSlotAvailabilityParams {
  slotId: string;
}

export interface ToggleVendorServiceParams {
  serviceId: string;
}

export interface RemoveVendorServiceParams {
  serviceId: string;
}

// ============================================================
// Vendor Responses
// ============================================================

export interface UpdateVendorResponse {
  success: boolean;
  code: number;
  message: string;
  data: Vendor;
}

export interface GetVendorsResponse {
  success: boolean;
  code: number;
  message: string;
  data: Vendor[];
  pagination: VendorPagination;
}

export interface GetVendorByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorDetails;
}

export interface DeleteVendorResponse {
  success: boolean;
  code: number;
  message: string;
}

// ============================================================
// Common Response Types
// ============================================================

export interface VendorServicePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ActiveVendor {
  _id: string;
  name: string;
}

export interface GetActiveVendorsResponse {
  success: boolean;
  code: number;
  message: string;
  data: ActiveVendor[];
}
