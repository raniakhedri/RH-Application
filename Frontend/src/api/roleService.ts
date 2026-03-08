import api from './axios';
import { ApiResponse } from '../types';

interface Permission {
  id: number;
  permission: string;
  label: string;
}

interface Role {
  id: number;
  nom: string;
  permissions: Permission[];
}

interface RoleRequest {
  nom: string;
  permissionIds: number[];
}

export const roleService = {
  getAll: () => api.get<ApiResponse<Role[]>>('/roles'),
  getById: (id: number) => api.get<ApiResponse<Role>>(`/roles/${id}`),
  create: (data: RoleRequest) => api.post<ApiResponse<Role>>('/roles', data),
  update: (id: number, data: RoleRequest) => api.put<ApiResponse<Role>>(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
  getAllPermissions: () => api.get<ApiResponse<Permission[]>>('/roles/permissions'),
};
