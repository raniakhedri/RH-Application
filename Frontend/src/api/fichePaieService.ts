import api from './axios';
import { ApiResponse, FichePaie } from '../types';

export const fichePaieService = {
  getAll: () => api.get<ApiResponse<FichePaie[]>>('/fiches-paie'),
  getById: (id: number) => api.get<ApiResponse<FichePaie>>(`/fiches-paie/${id}`),
  getByEmploye: (employeId: number) => api.get<ApiResponse<FichePaie[]>>(`/fiches-paie/employe/${employeId}`),
  getByMoisAndAnnee: (mois: number, annee: number) =>
    api.get<ApiResponse<FichePaie[]>>(`/fiches-paie/mois?mois=${mois}&annee=${annee}`),
  generer: (mois: number, annee: number) =>
    api.post<ApiResponse<FichePaie[]>>(`/fiches-paie/generer?mois=${mois}&annee=${annee}`),
  genererPourEmploye: (employeId: number, mois: number, annee: number) =>
    api.post<ApiResponse<FichePaie>>(`/fiches-paie/generer-employe?employeId=${employeId}&mois=${mois}&annee=${annee}`),
  valider: (id: number, adminEmployeId: number) =>
    api.put<ApiResponse<FichePaie>>(`/fiches-paie/${id}/valider?adminEmployeId=${adminEmployeId}`),
};
