import api from './axios';
import { ApiResponse, Referentiel, ReferentielRequest } from '../types';

export const referentielService = {
  // Types (enum)
  getAllTypes: () => api.get<ApiResponse<{ code: string; label: string }[]>>('/referentiels/types'),

  // Referentiels
  getAll: () => api.get<ApiResponse<Referentiel[]>>('/referentiels'),
  getById: (id: number) => api.get<ApiResponse<Referentiel>>(`/referentiels/${id}`),
  getByType: (type: string) => api.get<ApiResponse<Referentiel[]>>(`/referentiels/type/${type}`),
  getActiveByType: (type: string) => api.get<ApiResponse<Referentiel[]>>(`/referentiels/type/${type}/actifs`),
  create: (data: ReferentielRequest) => api.post<ApiResponse<Referentiel>>('/referentiels', data),
  update: (id: number, data: ReferentielRequest) => api.put<ApiResponse<Referentiel>>(`/referentiels/${id}`, data),
  toggleActif: (id: number) => api.patch<ApiResponse<Referentiel>>(`/referentiels/${id}/toggle-actif`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/referentiels/${id}`),
};
