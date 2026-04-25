import api from './axios';
import { ApiResponse, ForgotPasswordRequest, LoginRequest, LoginResponse, ResetPasswordRequest } from '../types';

export const authService = {
  login: (data: LoginRequest) => api.post<ApiResponse<LoginResponse>>('/auth/login', data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post<ApiResponse<void>>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordRequest) => api.post<ApiResponse<void>>('/auth/reset-password', data),
  clientLogin: (loginClient: string, passwordClient: string) =>
    api.post<ApiResponse<{
      clientId: number; nom: string; loginClient: string; email?: string;
      isClient: boolean; roles: string[]; permissions: string[];
      clientPages?: string[];
    }>>('/auth/client-login', { loginClient, passwordClient }),
};
