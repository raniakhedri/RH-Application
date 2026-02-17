import api from './axios';
import { ApiResponse, Pointage } from '../types';

export const pointageService = {
  getAll: () => api.get<ApiResponse<Pointage[]>>('/pointages'),
  getById: (id: number) => api.get<ApiResponse<Pointage>>(`/pointages/${id}`),
  getByEmploye: (employeId: number) => api.get<ApiResponse<Pointage[]>>(`/pointages/employe/${employeId}`),
  getByEmployeAndRange: (employeId: number, start: string, end: string) =>
    api.get<ApiResponse<Pointage[]>>(`/pointages/employe/${employeId}/range?start=${start}&end=${end}`),
  getByDate: (date: string) => api.get<ApiResponse<Pointage[]>>(`/pointages/date/${date}`),
  clockIn: (employeId: number) => api.post<ApiResponse<Pointage>>(`/pointages/clock-in/${employeId}`),
  clockOut: (employeId: number) => api.post<ApiResponse<Pointage>>(`/pointages/clock-out/${employeId}`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/pointages/${id}`),
};
