import axios from 'axios';

const BASE_URL = '/api/reactifs';

export interface ReactifInternDTO {
    id: number;
    type: 'TACHE' | 'MEDIA_PLAN_INTERN' | 'MEDIA_PLAN_EXTERN';
    contenu: string;
    dateReactif: string;
    nombreFois: number;

    // Tache
    tacheId?: number;
    tacheTitre?: string;
    tacheDescription?: string;
    tacheDateCreation?: string;
    tacheDateEcheance?: string;
    tacheDateFinExecution?: string;

    // Projet
    projetId?: number;
    projetNom?: string;

    // MediaPlan
    mediaPlanId?: number;
    mediaPlanTitre?: string;
    mediaPlanMois?: string;
    mediaPlanDateCreation?: string;

    // Manager
    managerId?: number;
    managerNom?: string;
    managerPrenom?: string;

    // Employe
    employeId?: number;
    employeNom?: string;
    employePrenom?: string;

    // Client
    clientId?: number;
    clientNom?: string;
}

export const reactifService = {
    // ── Create ────────────────────────────────────────────────────────────────
    async createForTache(tacheId: number, managerId: number, contenu: string): Promise<ReactifInternDTO> {
        const res = await axios.post(`${BASE_URL}/tache/${tacheId}?managerId=${managerId}`, { contenu });
        return res.data;
    },

    async createForMediaPlanIntern(mediaPlanId: number, managerId: number, contenu: string): Promise<ReactifInternDTO> {
        const res = await axios.post(`${BASE_URL}/mediaplan-intern/${mediaPlanId}?managerId=${managerId}`, { contenu });
        return res.data;
    },

    async createForMediaPlanExtern(mediaPlanId: number, clientId: number, contenu: string): Promise<ReactifInternDTO> {
        const res = await axios.post(`${BASE_URL}/mediaplan-extern/${mediaPlanId}?clientId=${clientId}`, { contenu });
        return res.data;
    },

    // ── List (admin dashboard) ────────────────────────────────────────────────
    async getAllTacheReactifs(): Promise<ReactifInternDTO[]> {
        const res = await axios.get(`${BASE_URL}/intern/taches`);
        return res.data;
    },

    async getAllMediaPlanInternReactifs(): Promise<ReactifInternDTO[]> {
        const res = await axios.get(`${BASE_URL}/intern/mediaplans`);
        return res.data;
    },

    async getAllMediaPlanExternReactifs(): Promise<ReactifInternDTO[]> {
        const res = await axios.get(`${BASE_URL}/extern`);
        return res.data;
    },

    // ── Detail ────────────────────────────────────────────────────────────────
    async getByTache(tacheId: number): Promise<ReactifInternDTO[]> {
        const res = await axios.get(`${BASE_URL}/by-tache/${tacheId}`);
        return res.data;
    },

    async getByMediaPlan(mediaPlanId: number): Promise<ReactifInternDTO[]> {
        const res = await axios.get(`${BASE_URL}/by-mediaplan/${mediaPlanId}`);
        return res.data;
    },
};
