import api from './axios';
import { ApiResponse, DemandeRequest, DemandeResponse, HistoriqueStatut, StatutDemande } from '../types';

export const demandeService = {
  getAll: () => api.get<ApiResponse<DemandeResponse[]>>('/demandes'),
  getById: (id: number) => api.get<ApiResponse<DemandeResponse>>(`/demandes/${id}`),
  getByEmploye: (employeId: number) => api.get<ApiResponse<DemandeResponse[]>>(`/demandes/employe/${employeId}`),
  getByStatut: (statut: StatutDemande) => api.get<ApiResponse<DemandeResponse[]>>(`/demandes/statut/${statut}`),
  create: (data: DemandeRequest) => api.post<ApiResponse<DemandeResponse>>('/demandes', data),
  createWithFile: (data: DemandeRequest, justificatif?: File) => {
    const formData = new FormData();
    formData.append('demande', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (justificatif) {
      formData.append('justificatif', justificatif);
    }
    return api.post<ApiResponse<DemandeResponse>>('/demandes/with-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFileUrl: (filename: string) => `/api/demandes/fichier/${filename}`,
  approve: (id: number, adminEmployeId: number) =>
    api.patch<ApiResponse<DemandeResponse>>(`/demandes/${id}/approve?adminEmployeId=${adminEmployeId}`),
  refuse: (id: number, adminEmployeId: number, commentaire?: string) =>
    api.patch<ApiResponse<DemandeResponse>>(
      `/demandes/${id}/refuse?adminEmployeId=${adminEmployeId}${commentaire ? `&commentaire=${encodeURIComponent(commentaire)}` : ''}`
    ),
  cancel: (id: number) => api.patch<ApiResponse<DemandeResponse>>(`/demandes/${id}/cancel`),
  batchApprove: (ids: number[], adminEmployeId: number) =>
    api.patch<ApiResponse<DemandeResponse[]>>(`/demandes/batch/approve?adminEmployeId=${adminEmployeId}`, ids),
  batchRefuse: (ids: number[], adminEmployeId: number, commentaire?: string) =>
    api.patch<ApiResponse<DemandeResponse[]>>(
      `/demandes/batch/refuse?adminEmployeId=${adminEmployeId}${commentaire ? `&commentaire=${encodeURIComponent(commentaire)}` : ''}`,
      ids
    ),
  getHistorique: (id: number) => api.get<ApiResponse<HistoriqueStatut[]>>(`/demandes/${id}/historique`),
};
