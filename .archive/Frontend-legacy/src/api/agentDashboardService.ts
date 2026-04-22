import api from './axios';
import { DashboardEmployeStatus } from '../types';

export const agentDashboardService = {
  getDashboard: () =>
    api.get<{ success: boolean; data: DashboardEmployeStatus[] }>('/agent/dashboard'),

  checkAgentActive: (employeId: number) =>
    api.get<{ success: boolean; data: { active: boolean } }>(`/agent/status/${employeId}`),
};
