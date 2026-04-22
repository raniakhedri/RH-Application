import api from './axios';
import {
  ApiResponse,
  CalendrierJour,
  CalendrierRequest,
  HoraireTravail,
  HoraireTravailRequest,
  TypeJour,
} from '../types';

export const calendrierService = {
  // Jours (fériés / spéciaux)
  getAllJours: () => api.get<ApiResponse<CalendrierJour[]>>('/calendrier/jours'),
  getJourById: (id: number) => api.get<ApiResponse<CalendrierJour>>(`/calendrier/jours/${id}`),
  getJoursByType: (type: TypeJour) => api.get<ApiResponse<CalendrierJour[]>>(`/calendrier/jours/type/${type}`),
  getJoursByPeriode: (debut: string, fin: string) =>
    api.get<ApiResponse<CalendrierJour[]>>(`/calendrier/jours/periode?debut=${debut}&fin=${fin}`),
  getFeries: (annee: number) => api.get<ApiResponse<CalendrierJour[]>>(`/calendrier/jours/feries/${annee}`),
  createJour: (data: CalendrierRequest) => api.post<ApiResponse<CalendrierJour>>('/calendrier/jours', data),
  updateJour: (id: number, data: CalendrierRequest) => api.put<ApiResponse<CalendrierJour>>(`/calendrier/jours/${id}`, data),
  deleteJour: (id: number) => api.delete<ApiResponse<void>>(`/calendrier/jours/${id}`),

  // Horaires de travail
  getAllHoraires: () => api.get<ApiResponse<HoraireTravail[]>>('/calendrier/horaires'),
  getHoraireById: (id: number) => api.get<ApiResponse<HoraireTravail>>(`/calendrier/horaires/${id}`),
  createHoraire: (data: HoraireTravailRequest) => api.post<ApiResponse<HoraireTravail>>('/calendrier/horaires', data),
  updateHoraire: (id: number, data: HoraireTravailRequest) => api.put<ApiResponse<HoraireTravail>>(`/calendrier/horaires/${id}`, data),
  deleteHoraire: (id: number) => api.delete<ApiResponse<void>>(`/calendrier/horaires/${id}`),
};
