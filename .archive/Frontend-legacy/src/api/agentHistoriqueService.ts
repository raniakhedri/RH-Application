import api from './axios';
import { HistoriqueEmploye } from '../types';

export const agentHistoriqueService = {
  getHistorique: (employeId: number, debut: string, fin: string) =>
    api.get<{ success: boolean; data: HistoriqueEmploye }>(
      `/agent/historique/${employeId}?debut=${debut}&fin=${fin}`
    ),

  getHistoriqueTous: (debut: string, fin: string) =>
    api.get<{ success: boolean; data: HistoriqueEmploye[] }>(
      `/agent/historique?debut=${debut}&fin=${fin}`
    ),
};
