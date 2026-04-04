import api from './axios';

export interface CalendrierProjetDTO {
    id?: number;
    managerId: number;
    socialManagerId?: number;
    dateSlot: string;
    projectName?: string;
    urgent: boolean;
    type: 'BUSY' | 'BOOKED';
    statut: 'DISPONIBLE' | 'EN_ATTENTE' | 'VALIDE' | 'ANNULE';
}

export const calendrierProjetService = {
    getSlotsBetween: async (startDate: string, endDate: string) => {
        const response = await api.get(`/calendrier-projets/between?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    getManagerSlotsBetween: async (managerId: number, startDate: string, endDate: string) => {
        const response = await api.get(`/calendrier-projets/manager/${managerId}?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    createBusySlot: async (data: CalendrierProjetDTO) => {
        const response = await api.post('/calendrier-projets/busy', data);
        return response.data;
    },

    createBookedSlot: async (data: CalendrierProjetDTO) => {
        const response = await api.post('/calendrier-projets/booked', data);
        return response.data;
    },

    updateSlotStatus: async (id: number, status: string) => {
        const response = await api.put(`/calendrier-projets/${id}/status?status=${status}`);
        return response.data;
    },

    deleteSlot: async (id: number) => {
        const response = await api.delete(`/calendrier-projets/${id}`);
        return response.data;
    }
};
