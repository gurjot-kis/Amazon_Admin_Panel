export interface VendorCurrentLocation {
  type: string;
  coordinates: number[];
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

export interface VendorCateoryDetails {
  _id: string;
  name: string;
  image: string;
}

export interface VendorPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetVendorsResponse {
  success: boolean;
  code: number;
  message: string;
  data: Vendor[];
  pagination: VendorPagination;
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

export interface UpdateVendorStatusPayload {
  status: number;
}

export interface UpdateVendorVerificationPayload {
  isVendorVerified: boolean;
}

export interface UpdateVendorAvailabilityPayload {
  isAvailableNow: boolean;
}

export interface UpdateVendorResponse {
  success: boolean;
  code: number;
  message: string;
  data: Vendor;
}

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

export interface GetVendorByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorDetails;
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

// Vendor Slot interfaces
export interface VendorSlotLocation {
  type: string;
  coordinates: [number, number];
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

export interface AddVendorSlotResponse {
  success: boolean;
  code: number;
  message: string;
  data: unknown;
}

export interface VendorSlot {
  _id: string;
  vendor_id: string;
  category_id: string;
  categoryName: string;
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

export interface GetVendorSlotsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: VendorSlot[];
  pagination: VendorSlotPagination;
}

export interface GetVendorSlotsParams {
  page: number;
  limit: number;
  category_id?: string;
  status?: string;
  date?: string;
}

export interface UpdateVendorSlotAvailabilityResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorSlot;
}

export interface GetVendorSlotByIdResponse {
  success: boolean;
  message: string;
  data: VendorSlot;
}
