import api from './axios';
import { ApiResponse, MediaPlan, MediaPlanRequest } from '../types';

export const mediaPlanService = {
    getAll: () => api.get<ApiResponse<MediaPlan[]>>('/media-plans'),
    getById: (id: number) => api.get<ApiResponse<MediaPlan>>(`/media-plans/${id}`),
    getByClient: (clientId: number) => api.get<ApiResponse<MediaPlan[]>>(`/media-plans/client/${clientId}`),
    getByEmploye: (employeId: number) => api.get<ApiResponse<MediaPlan[]>>(`/media-plans/employe/${employeId}`),
    create: (data: MediaPlanRequest) => api.post<ApiResponse<MediaPlan>>('/media-plans', data),
    update: (id: number, data: Partial<MediaPlanRequest>) => api.put<ApiResponse<MediaPlan>>(`/media-plans/${id}`, data),
    delete: (id: number) => api.delete<ApiResponse<void>>(`/media-plans/${id}`),
    approve: (id: number, managerId: number) => api.patch<ApiResponse<MediaPlan>>(`/media-plans/${id}/approve?managerId=${managerId}`),
    disapprove: (id: number) => api.patch<ApiResponse<MediaPlan>>(`/media-plans/${id}/disapprove`),
};
