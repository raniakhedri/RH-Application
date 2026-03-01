import api from './axios';
import { ApiResponse, LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: (data: LoginRequest) => api.post<ApiResponse<LoginResponse>>('/auth/login', data),
};
