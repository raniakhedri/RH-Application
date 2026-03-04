import api from './axios';
import { ApiResponse, DashboardEmployeStatus, AgentConfig } from '../types';

export const agentService = {
  getDashboard: () => api.get<ApiResponse<DashboardEmployeStatus[]>>('/agent/dashboard'),
  getConfig: () => api.get<ApiResponse<AgentConfig>>('/agent/config'),
};
