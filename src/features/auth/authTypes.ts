export interface RegisterRequest {
  name: string;
  phone: string;
  gender: string;
  password: string;
  avatar?: string;
  profilePicture?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface LoginData {
  user: User;
  token: string;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  gender: string;
  status: string;
  avatar?: string;
  profilePicture?: string;
  bio?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProfileResponse {
  userObj: User;
}

export interface ForgotPasswordRequest {
  email: string;
}
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
}
