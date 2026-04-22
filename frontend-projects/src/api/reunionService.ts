import api from './axios';
import { ApiResponse, Reunion, ReunionRequest } from '../types';

export const reunionService = {
  create: (data: ReunionRequest, initiateurId: number) =>
    api.post<ApiResponse<Reunion>>(`/reunions?initiateurId=${initiateurId}`, data),

  respond: (id: number, accepter: boolean) =>
    api.patch<ApiResponse<Reunion>>(`/reunions/${id}/respond?accepter=${accepter}`),

  getByEmploye: (employeId: number) =>
    api.get<ApiResponse<Reunion[]>>(`/reunions/employe/${employeId}`),

  getByEmployeAndBetween: (employeId: number, start: string, end: string) =>
    api.get<ApiResponse<Reunion[]>>(`/reunions/employe/${employeId}/between?start=${start}&end=${end}`),

  getBetween: (start: string, end: string) =>
    api.get<ApiResponse<Reunion[]>>(`/reunions/between?start=${start}&end=${end}`),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/reunions/${id}`),
};
