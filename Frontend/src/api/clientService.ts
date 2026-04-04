import api from './axios';

export interface ClientDTO {
    id: number;
    nom: string;
    description?: string;
    telephone?: string;
    responsable?: string;
    fileName?: string;
    fileUrl?: string;
    dateCreation: string;
}

const BASE = '/clients';

const getAllClients = () => api.get<{ data: ClientDTO[] }>(BASE);
const getClientById = (id: number) => api.get<{ data: ClientDTO }>(`${BASE}/${id}`);

const createClient = (nom: string, description: string, telephone: string, responsable: string, file?: File) => {
    const form = new FormData();
    form.append('nom', nom);
    if (description) form.append('description', description);
    if (telephone) form.append('telephone', telephone);
    if (responsable) form.append('responsable', responsable);
    if (file) form.append('file', file);
    return api.post<{ data: ClientDTO }>(BASE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

const updateClient = (id: number, nom: string, description: string, telephone: string, responsable: string, file?: File) => {
    const form = new FormData();
    if (nom) form.append('nom', nom);
    if (description) form.append('description', description);
    form.append('telephone', telephone ?? '');
    form.append('responsable', responsable ?? '');
    if (file) form.append('file', file);
    return api.put<{ data: ClientDTO }>(`${BASE}/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

const deleteClient = (id: number) => api.delete(`${BASE}/${id}`);

export const clientService = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
};
