import api from './axios';
import { RapportInactivite } from '../types';

export const rapportInactiviteService = {
  getAll: () =>
    api.get<{ success: boolean; data: RapportInactivite[] }>('/agent/rapports'),

  genererSemaineCourante: () =>
    api.post<{ success: boolean; data: RapportInactivite[] }>('/agent/rapports/generer'),

  genererPeriode: (debut: string, fin: string) =>
    api.post<{ success: boolean; data: RapportInactivite[] }>(
      `/agent/rapports/generer-periode?debut=${debut}&fin=${fin}`
    ),

  decider: (id: number, data: { decideParId: number; decision: string; commentaire?: string }) =>
    api.put<{ success: boolean; data: RapportInactivite }>(`/agent/rapports/${id}/decision`, data),
};
