import api from './axios';
import { ApiResponse, CompetenceDTO } from '../types';

export const competenceService = {
  getByEmploye: (employeId: number) => api.get<ApiResponse<CompetenceDTO[]>>(`/competences/employe/${employeId}`),
  create: (data: CompetenceDTO) => api.post<ApiResponse<CompetenceDTO>>('/competences', data),
  update: (id: number, data: CompetenceDTO) => api.put<ApiResponse<CompetenceDTO>>(`/competences/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/competences/${id}`),
};
