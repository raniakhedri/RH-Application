import api from './axios';
import { ApiResponse, DocumentEmployeDTO } from '../types';

export const documentEmployeService = {
  getByEmploye: (employeId: number) => api.get<ApiResponse<DocumentEmployeDTO[]>>(`/documents-employe/employe/${employeId}`),
  getExpiringSoon: (days: number = 30) => api.get<ApiResponse<DocumentEmployeDTO[]>>(`/documents-employe/expiring?days=${days}`),
  getExpired: () => api.get<ApiResponse<DocumentEmployeDTO[]>>('/documents-employe/expired'),
  create: (data: Partial<DocumentEmployeDTO>) => api.post<ApiResponse<DocumentEmployeDTO>>('/documents-employe', data),
  update: (id: number, data: Partial<DocumentEmployeDTO>) => api.put<ApiResponse<DocumentEmployeDTO>>(`/documents-employe/${id}`, data),
  uploadFichier: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<DocumentEmployeDTO>>(`/documents-employe/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: number) => api.delete<ApiResponse<void>>(`/documents-employe/${id}`),
};
