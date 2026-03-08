import api from './axios';
import { ApiResponse, TacheDetail, Tache, StatutTache } from '../types';

export const tacheService = {
  getAll: () => api.get<ApiResponse<Tache[]>>('/taches'),
  getById: (id: number) => api.get<ApiResponse<Tache>>(`/taches/${id}`),
  getByProjet: (projetId: number) => api.get<ApiResponse<Tache[]>>(`/taches/projet/${projetId}`),
  // Returns enriched TacheDetail with project + equipe + members info
  getByAssignee: (employeId: number) => api.get<ApiResponse<TacheDetail[]>>(`/taches/assignee/${employeId}`),
  create: (projetId: number, data: Partial<Tache>) => api.post<ApiResponse<Tache>>(`/taches/projet/${projetId}`, data),
  update: (id: number, data: Partial<Tache>) => api.put<ApiResponse<Tache>>(`/taches/${id}`, data),
  assign: (id: number, employeId: number) => api.patch<ApiResponse<Tache>>(`/taches/${id}/assign/${employeId}`),
  changeStatut: (id: number, statut: StatutTache) => api.patch<ApiResponse<Tache>>(`/taches/${id}/statut?statut=${statut}`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/taches/${id}`),
};
