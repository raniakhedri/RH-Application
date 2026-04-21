import api from './axios';
import { ApiResponse } from '../types';

export interface TacheObligatoireDTO {
    id: number;
    nom: string;
    dates: string[];
    equipeId: number;
    equipeNom: string;
    employeId: number | null;
    employeNom: string | null;
}

export interface TacheObligatoireRequest {
    nom: string;
    equipeId: number;
    employeId: number | null;
    dates: string[];
}

export const tacheObligatoireService = {
    getAll: () =>
        api.get<ApiResponse<TacheObligatoireDTO[]>>('/taches-obligatoires'),

    getByEmploye: (employeId: number) =>
        api.get<ApiResponse<TacheObligatoireDTO[]>>(`/taches-obligatoires/employe/${employeId}`),

    create: (data: TacheObligatoireRequest) =>
        api.post<ApiResponse<TacheObligatoireDTO>>('/taches-obligatoires', data),

    delete: (id: number) =>
        api.delete<ApiResponse<void>>(`/taches-obligatoires/${id}`),
};
