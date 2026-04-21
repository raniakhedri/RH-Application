import api from './axios';
import { ApiResponse, RoleDTO, RoleRequest, PermissionDTO } from '../types';

export const roleService = {
  getAll: () => api.get<ApiResponse<RoleDTO[]>>('/roles'),
  getById: (id: number) => api.get<ApiResponse<RoleDTO>>(`/roles/${id}`),
  create: (data: RoleRequest) => api.post<ApiResponse<RoleDTO>>('/roles', data),
  update: (id: number, data: RoleRequest) => api.put<ApiResponse<RoleDTO>>(`/roles/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/roles/${id}`),
  getAllPermissions: () => api.get<ApiResponse<PermissionDTO[]>>('/roles/permissions'),
};
