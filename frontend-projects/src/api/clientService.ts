import api from './axios';

export interface ClientDTO {
    id: number;
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    notes?: string;
    // Contact principal
    contactNom?: string;
    contactPoste?: string;
    contactEmail?: string;
    contactTelephone?: string;
    // Account
    hasAccount?: boolean;
    loginClient?: string;
    /** Comma-separated page keys (e.g. "MEDIA_PLANS,PROJETS,FICHIERS") */
    clientPages?: string;
    /** Only returned once at creation */
    generatedPassword?: string;
    // Legacy
    description?: string;
    responsable?: string;
    fileName?: string;
    fileUrl?: string;
    dateCreation: string;
}

const BASE = '/clients';

const getAllClients = () => api.get<{ data: ClientDTO[] }>(BASE);
const getClientById = (id: number) => api.get<{ data: ClientDTO }>(`${BASE}/${id}`);
const getClientPortalDriveLink = (id: number) => api.get<{ data: string }>(`${BASE}/${id}/client-portal-drive-link`);
const getDriveFiles = (id: number) => api.get<{ data: MonthFilesGroup[] }>(`${BASE}/${id}/drive-files`);

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    thumbnailLink?: string;
    size?: number;
    modifiedTime?: string;
    subFolder?: string;
}

export interface MonthFilesGroup {
    monthLabel: string;
    files: DriveFile[];
}

const createClient = (data: {
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    notes?: string;
    contactNom?: string;
    contactPoste?: string;
    contactEmail?: string;
    contactTelephone?: string;
    createAccount?: boolean;
    clientPages?: string;
    file?: File;
}) => {
    const form = new FormData();
    form.append('nom', data.nom);
    if (data.email) form.append('email', data.email);
    if (data.telephone) form.append('telephone', data.telephone);
    if (data.adresse) form.append('adresse', data.adresse);
    if (data.notes) form.append('notes', data.notes);
    if (data.contactNom) form.append('contactNom', data.contactNom);
    if (data.contactPoste) form.append('contactPoste', data.contactPoste);
    if (data.contactEmail) form.append('contactEmail', data.contactEmail);
    if (data.contactTelephone) form.append('contactTelephone', data.contactTelephone);
    form.append('createAccount', String(data.createAccount ?? false));
    if (data.clientPages != null) form.append('clientPages', data.clientPages);
    if (data.file) form.append('file', data.file);
    return api.post<{ data: ClientDTO }>(BASE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

const updateClient = (id: number, data: {
    nom?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    notes?: string;
    contactNom?: string;
    contactPoste?: string;
    contactEmail?: string;
    contactTelephone?: string;
    regeneratePassword?: boolean;
    clientPages?: string;
    file?: File;
}) => {
    const form = new FormData();
    if (data.nom) form.append('nom', data.nom);
    form.append('email', data.email ?? '');
    form.append('telephone', data.telephone ?? '');
    form.append('adresse', data.adresse ?? '');
    form.append('notes', data.notes ?? '');
    form.append('contactNom', data.contactNom ?? '');
    form.append('contactPoste', data.contactPoste ?? '');
    form.append('contactEmail', data.contactEmail ?? '');
    form.append('contactTelephone', data.contactTelephone ?? '');
    form.append('regeneratePassword', String(data.regeneratePassword ?? false));
    if (data.clientPages != null) form.append('clientPages', data.clientPages);
    if (data.file) form.append('file', data.file);
    return api.put<{ data: ClientDTO }>(`${BASE}/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

const deleteClient = (id: number) => api.delete(`${BASE}/${id}`);

export const clientService = {
    getAllClients,
    getClientById,
    getClientPortalDriveLink,
    getDriveFiles,
    createClient,
    updateClient,
    deleteClient,
};
