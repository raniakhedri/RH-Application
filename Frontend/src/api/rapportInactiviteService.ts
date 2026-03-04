import api from './axios';
import { ApiResponse, RapportInactivite } from '../types';

export const rapportInactiviteService = {
  getAll: () => api.get<ApiResponse<RapportInactivite[]>>('/rapports-inactivite'),
  getById: (id: number) => api.get<ApiResponse<RapportInactivite>>(`/rapports-inactivite/${id}`),
  getByEmploye: (employeId: number) =>
    api.get<ApiResponse<RapportInactivite[]>>(`/rapports-inactivite/employe/${employeId}`),
  getEnAttente: () => api.get<ApiResponse<RapportInactivite[]>>('/rapports-inactivite/en-attente'),
  generer: () => api.post<ApiResponse<RapportInactivite[]>>('/rapports-inactivite/generer'),
  genererPeriode: (debut: string, fin: string) =>
    api.post<ApiResponse<RapportInactivite[]>>(`/rapports-inactivite/generer-periode?debut=${debut}&fin=${fin}`),
  decider: (id: number, adminEmployeId: number, decision: string, commentaire?: string) =>
    api.put<ApiResponse<RapportInactivite>>(`/rapports-inactivite/${id}/decider`, {
      adminEmployeId,
      decision,
      commentaire,
    }),
};
