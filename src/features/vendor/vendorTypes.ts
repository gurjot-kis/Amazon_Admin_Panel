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
  user_id: string;
  fullName: string;
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
// Vendor Slot Models / Details
// ============================================================

export interface VendorSlotLocation {
  type: string;
  coordinates: [number, number];
}

export interface VendorSlot {
  _id: string;
  vendor_id: string;
  category_id: string;
  categoryName: string;
  categoryImage?: string;
  slotType: string[];
  date: string;
  startTime: string;
  endTime: string;
  location: VendorSlotLocation;
  status: string;
  bookedCount: number;
  capacity: number;
  booking_id: string | null;
}

export interface VendorSlotPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================
// Vendor Service Models / Details
// ============================================================

export interface VendorService {
  _id: string;
  category: {
    _id: string;
    name: string;
    category_image: string | null;
  } | null;
  service: {
    _id: string;
    name: string;
    category_image: string | null;
  } | null;
  status: "active" | "inactive";
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
  gst_number: string;
  vendorCategories: string[];
  serviceableAreas: {
    pincode: string;
  }[];
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

export interface AddVendorSlotPayload {
  category_id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: {
    coordinates: [number, number];
  };
}

export interface AddVendorServicesPayload {
  service_ids: string[];
}

export interface UpdateVendorSlotRequest {
  slotId: string;
  payload: AddVendorSlotPayload;
}

export interface GetVendorSlotsParams {
  page: number;
  limit: number;
  category_id?: string;
  status?: string;
  date?: string;
}

export interface GetVendorSlotByIdParams {
  slotId: string;
}

export interface UpdateVendorSlotAvailabilityParams {
  slotId: string;
}

export interface GetVendorServicesParams {
  page?: number;
  limit?: number;
  status?: "active" | "inactive";
  search?: string;
}

export interface AddVendorServicesPayload {
  service_ids: string[];
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

export interface AddVendorSlotResponse {
  success: boolean;
  code: number;
  message: string;
  data: unknown;
}

export interface GetVendorSlotsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: VendorSlot[];
  pagination: VendorSlotPagination;
}

export interface GetVendorSlotByIdResponse {
  success: boolean;
  message: string;
  data: VendorSlot;
}

export interface UpdateVendorSlotAvailabilityResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorSlot;
}

export interface GetVendorServicesResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorService[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AddVendorServicesResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    inserted: number;
    message: string;
  };
}

export interface ToggleVendorServiceResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorService;
}

export interface RemoveVendorServiceResponse {
  success: boolean;
  code: number;
  message: string;
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
