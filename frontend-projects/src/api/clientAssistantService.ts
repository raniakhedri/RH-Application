import api from './axios';

export interface ClientAssistantAction {
  type: string;
  label?: string;
  status?: 'done' | 'failed' | 'pending';
}

export interface ClientAssistantAskRequest {
  clientId: number;
  message: string;
  threadId?: string | null;
}

export interface ClientAssistantResponse {
  reply: string;
  actions?: ClientAssistantAction[];
  executedActions?: ClientAssistantAction[];
  warnings?: string[];
  missingInfo?: string[];
  missing_info?: string[];
  threadId?: string;
}

const BASE = '/client-assistant';

const ask = (payload: ClientAssistantAskRequest) =>
  api.post<{ data: ClientAssistantResponse }>(`${BASE}/ask`, payload);

export const clientAssistantService = {
  ask,
};
