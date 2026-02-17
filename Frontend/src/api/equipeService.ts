import api from './axios';
import { ApiResponse, Equipe } from '../types';

export const equipeService = {
  getAll: () => api.get<ApiResponse<Equipe[]>>('/equipes'),
  getById: (id: number) => api.get<ApiResponse<Equipe>>(`/equipes/${id}`),
  getByProjet: (projetId: number) => api.get<ApiResponse<Equipe[]>>(`/equipes/projet/${projetId}`),
  create: (projetId: number, nom: string) => api.post<ApiResponse<Equipe>>(`/equipes?projetId=${projetId}&nom=${nom}`),
  addMembre: (equipeId: number, employeId: number) => api.post<ApiResponse<Equipe>>(`/equipes/${equipeId}/membres/${employeId}`),
  removeMembre: (equipeId: number, employeId: number) => api.delete<ApiResponse<Equipe>>(`/equipes/${equipeId}/membres/${employeId}`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/equipes/${id}`),
};
