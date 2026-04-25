import api from './axios';
import { ApiResponse, Projet, StatutProjet } from '../types';

export const projetService = {
  getAll: () => api.get<ApiResponse<Projet[]>>('/projets'),
  getByEmploye: (employeId: number) => api.get<ApiResponse<Projet[]>>(`/projets/by-employe/${employeId}`),
  getByClient: (clientId: number) => api.get<ApiResponse<Projet[]>>(`/projets/by-client/${clientId}`),
  getByDepartement: (dept: string) => api.get<ApiResponse<Projet[]>>(`/projets/by-departement/${dept}`),
  getById: (id: number) => api.get<ApiResponse<Projet>>(`/projets/${id}`),
  getByStatut: (statut: StatutProjet) => api.get<ApiResponse<Projet[]>>(`/projets/statut/${statut}`),
  create: (data: Partial<Projet> & { equipeIds?: number[] }) => api.post<ApiResponse<Projet>>('/projets', data),
  update: (id: number, data: Partial<Projet> & { equipeIds?: number[] }) => api.put<ApiResponse<Projet>>(`/projets/${id}`, data),
  changeStatut: (id: number, statut: StatutProjet, force: boolean = false) => api.patch<ApiResponse<Projet>>(`/projets/${id}/statut?statut=${statut}&force=${force}`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/projets/${id}`),
};
