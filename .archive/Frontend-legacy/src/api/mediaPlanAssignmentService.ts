import api from './axios';
import { ApiResponse, MediaPlanAssignment, MediaPlanAssignmentRequest } from '../types';

export const mediaPlanAssignmentService = {
    assign: (data: MediaPlanAssignmentRequest) =>
        api.post<ApiResponse<MediaPlanAssignment[]>>('/media-plan-assignments', data),
    getByClient: (clientId: number) =>
        api.get<ApiResponse<MediaPlanAssignment[]>>(`/media-plan-assignments/client/${clientId}`),
    getByEmploye: (employeId: number) =>
        api.get<ApiResponse<MediaPlanAssignment[]>>(`/media-plan-assignments/employe/${employeId}`),
    getSocialMediaEmployees: () =>
        api.get<ApiResponse<{ id: number; nom: string; prenom: string; departement: string; email: string }[]>>(
            '/media-plan-assignments/social-media-employees'
        ),
    remove: (id: number) => api.delete<ApiResponse<void>>(`/media-plan-assignments/${id}`),
};
