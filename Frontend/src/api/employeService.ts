import api from './axios';
import { ApiResponse, Employe } from '../types';

export const employeService = {
  getAll: () => api.get<ApiResponse<Employe[]>>('/employes'),
  getById: (id: number) => api.get<ApiResponse<Employe>>(`/employes/${id}`),
  getByMatricule: (matricule: string) => api.get<ApiResponse<Employe>>(`/employes/matricule/${matricule}`),
  getSubordinates: (id: number) => api.get<ApiResponse<Employe[]>>(`/employes/${id}/subordinates`),
  create: (data: Partial<Employe>) => api.post<ApiResponse<Employe>>('/employes', data),
  update: (id: number, data: Partial<Employe>) => api.put<ApiResponse<Employe>>(`/employes/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/employes/${id}`),
  updateSoldeConge: (id: number, solde: number) => api.patch<ApiResponse<void>>(`/employes/${id}/solde-conge?solde=${solde}`),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<Employe>>(`/employes/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
