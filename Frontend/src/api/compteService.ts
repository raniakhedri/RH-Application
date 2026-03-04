import api from './axios';
import { ApiResponse, Compte } from '../types';

export const compteService = {
  getAll: () => api.get<ApiResponse<Compte[]>>('/comptes'),
  getById: (id: number) => api.get<ApiResponse<Compte>>(`/comptes/${id}`),
  updateRole: (id: number, roleId: number) => api.put<ApiResponse<Compte>>(`/comptes/${id}/role?roleId=${roleId}`),
  toggle: (id: number) => api.put<ApiResponse<Compte>>(`/comptes/${id}/toggle`),
  disable: (id: number) => api.put(`/comptes/${id}/disable`),
  enable: (id: number) => api.put(`/comptes/${id}/enable`),
};
