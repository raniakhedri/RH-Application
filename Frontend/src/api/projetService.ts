import api from './axios';
import { ApiResponse, Projet, StatutProjet } from '../types';

export const projetService = {
  getAll: () => api.get<ApiResponse<Projet[]>>('/projets'),
  getByEmploye: (employeId: number) => api.get<ApiResponse<Projet[]>>(`/projets/by-employe/${employeId}`),
  getById: (id: number) => api.get<ApiResponse<Projet>>(`/projets/${id}`),
  getByStatut: (statut: StatutProjet) => api.get<ApiResponse<Projet[]>>(`/projets/statut/${statut}`),
  create: (data: Partial<Projet> & { equipeIds?: number[] }) => api.post<ApiResponse<Projet>>('/projets', data),
  update: (id: number, data: Partial<Projet> & { equipeIds?: number[] }) => api.put<ApiResponse<Projet>>(`/projets/${id}`, data),
  changeStatut: (id: number, statut: StatutProjet) => api.patch<ApiResponse<Projet>>(`/projets/${id}/statut?statut=${statut}`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/projets/${id}`),
};
