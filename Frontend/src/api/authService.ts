import api from './axios';
import { ApiResponse, LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: (data: LoginRequest) => api.post<ApiResponse<LoginResponse>>('/auth/login', data),
  register: (employeId: number, username: string, password: string, role: string = 'EMPLOYE') =>
    api.post<ApiResponse<string>>(`/auth/register?employeId=${employeId}&username=${username}&password=${password}&role=${role}`),
  changePassword: (data: { username: string; oldPassword: string; newPassword: string }) =>
    api.post<ApiResponse<string>>('/auth/change-password', data),
};
