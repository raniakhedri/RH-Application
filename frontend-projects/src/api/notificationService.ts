import api from './axios';
import { ApiResponse, NotificationResponse } from '../types';

export const notificationService = {
  getByEmploye: (employeId: number) =>
    api.get<ApiResponse<NotificationResponse[]>>(`/notifications/employe/${employeId}`),

  getUnread: (employeId: number) =>
    api.get<ApiResponse<NotificationResponse[]>>(`/notifications/employe/${employeId}/unread`),

  getUnreadCount: (employeId: number) =>
    api.get<ApiResponse<{ count: number }>>(`/notifications/employe/${employeId}/unread-count`),

  markAsRead: (id: number) =>
    api.patch<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`),

  markAllAsRead: (employeId: number) =>
    api.patch<ApiResponse<void>>(`/notifications/employe/${employeId}/read-all`),
};
