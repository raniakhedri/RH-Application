import api from './axios';
import { ApiResponse, DemandeResponse } from '../types';

export interface DemandePapierCreateRequest {
    raison: string;       // stored as "[libellé] raison text"
    employeId: number;
}

export const demandePapierService = {
    /** Fetch all demandes papier (ADMINISTRATION type) */
    getAll: () =>
        api.get<ApiResponse<DemandeResponse[]>>('/demandes-papier'),

    /** Fetch a single demande papier by id */
    getById: (id: number) =>
        api.get<ApiResponse<DemandeResponse>>(`/demandes-papier/${id}`),

    /** Create a new demande papier */
    create: (data: DemandePapierCreateRequest) =>
        api.post<ApiResponse<DemandeResponse>>('/demandes-papier', data),

    /** Accept a demande papier → VALIDEE */
    accept: (id: number) =>
        api.patch<ApiResponse<DemandeResponse>>(`/demandes-papier/${id}/accept`),

    /** Cancel / refuse a demande papier → ANNULEE */
    cancel: (id: number, motif?: string) =>
        api.patch<ApiResponse<DemandeResponse>>(
            `/demandes-papier/${id}/cancel`,
            motif ? { motifAnnulation: motif } : {}
        ),
};
