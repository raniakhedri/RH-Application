import api from './axios';
import { ApiResponse, Equipe, Employe, EquipeCreateRequest } from '../types';

export const equipeService = {
  getAll: () => api.get<ApiResponse<Equipe[]>>('/equipes'),
  getById: (id: number) => api.get<ApiResponse<Equipe>>(`/equipes/${id}`),
  getByProjet: (projetId: number) => api.get<ApiResponse<Equipe[]>>(`/equipes/projet/${projetId}`),
  getMembresByProjet: (projetId: number) => api.get<ApiResponse<Employe[]>>(`/equipes/projet/${projetId}/membres`),
  create: (data: EquipeCreateRequest) => api.post<ApiResponse<Equipe>>('/equipes', data),
  update: (id: number, data: EquipeCreateRequest) => api.put<ApiResponse<Equipe>>(`/equipes/${id}`, data),
  addMembre: (equipeId: number, employeId: number) => api.post<ApiResponse<Equipe>>(`/equipes/${equipeId}/membres/${employeId}`),
  removeMembre: (equipeId: number, employeId: number) => api.delete<ApiResponse<Equipe>>(`/equipes/${equipeId}/membres/${employeId}`),
  assignToProjet: (equipeId: number, projetId: number) => api.patch<ApiResponse<Equipe>>(`/equipes/${equipeId}/projet/${projetId}`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/equipes/${id}`),
};
