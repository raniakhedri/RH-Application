import api from './axios';
import { ApiResponse, DemandeRequest, DemandeResponse, StatutDemande } from '../types';

export const demandeService = {
  getAll: () => api.get<ApiResponse<DemandeResponse[]>>('/demandes'),
  getById: (id: number) => api.get<ApiResponse<DemandeResponse>>(`/demandes/${id}`),
  getByEmploye: (employeId: number) => api.get<ApiResponse<DemandeResponse[]>>(`/demandes/employe/${employeId}`),
  getByStatut: (statut: StatutDemande) => api.get<ApiResponse<DemandeResponse[]>>(`/demandes/statut/${statut}`),
  create: (data: DemandeRequest) => api.post<ApiResponse<DemandeResponse>>('/demandes', data),
  submit: (id: number) => api.patch<ApiResponse<DemandeResponse>>(`/demandes/${id}/submit`),
  cancel: (id: number) => api.patch<ApiResponse<DemandeResponse>>(`/demandes/${id}/cancel`),
};
