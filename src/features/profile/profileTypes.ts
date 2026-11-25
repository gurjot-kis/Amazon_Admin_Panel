// Admin Profile
export interface AdminProfile {
  user_id: string;
  fullName: string;
  email: string;
  countryCode?: string;
  phone: string;
  address: string;
  profilePicture: string;
}

export interface GetAdminProfileResponse {
  success: boolean;
  code: number;
  message: string;
  data: AdminProfile;
}

export type UpdateAdminProfilePayload = any;

export interface UpdateAdminProfileResponse {
  success: boolean;
  code: number;
  message: string;
  data: AdminProfile;
}

// Vendor Profile
export interface VendorProfile {
  user_id: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode?: string;
  address: string;
  profilePicture: string;
  code: string;
}

export interface GetVendorProfileResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorProfile;
}

export type UpdateVendorProfilePayload = any;

export interface UpdateVendorProfileResponse {
  success: boolean;
  code: number;
  message: string;
  data: VendorProfile;
}
