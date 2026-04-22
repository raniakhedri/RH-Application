import api from './axios';
import { ApiResponse, Validation, ValidationRequest } from '../types';

export const validationService = {
  getByDemande: (demandeId: number) => api.get<ApiResponse<Validation[]>>(`/validations/demande/${demandeId}`),
  getByValidateur: (validateurId: number) => api.get<ApiResponse<Validation[]>>(`/validations/validateur/${validateurId}`),
  getPendingByValidateur: (validateurId: number) => api.get<ApiResponse<Validation[]>>(`/validations/validateur/${validateurId}/pending`),
  create: (data: ValidationRequest) => api.post<ApiResponse<Validation>>('/validations', data),
  approve: (id: number, commentaire?: string) => api.patch<ApiResponse<Validation>>(`/validations/${id}/approve?commentaire=${commentaire || ''}`),
  refuse: (id: number, commentaire?: string) => api.patch<ApiResponse<Validation>>(`/validations/${id}/refuse?commentaire=${commentaire || ''}`),
};
