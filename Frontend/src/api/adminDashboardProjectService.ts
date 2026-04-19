import api from './axios';

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface AlerteDTO {
  niveau: 'CRITIQUE' | 'WARNING' | 'INFO';
  projetNom: string | null;
  projetId: number | null;
  tacheNom: string | null;
  tacheId: number | null;
  employeNom: string | null;
  managerNom: string | null;
  probleme: string;
  actionSuggere: string;
  retardJours: number;
  dateDetection: string;
}

export interface ProjetSummaryDTO {
  projetId: number;
  projetNom: string;
  clientNom: string | null;
  statut: string;
  managerNoms: string[];
  managerIds: number[];
  progressionPourcentage: number;
  totalTaches: number;
  tachesDone: number;
  tachesInProgress: number;
  tachesTodo: number;
  tachesEnRetard: number;
  dateDebut: string | null;
  dateFin: string | null;
  typeProjet: string;
}

export interface TacheManagerDTO {
  tacheId: number;
  tacheNom: string;
  employeNom: string | null;
  employeId: number | null;
  statut: string;
  dateEcheance: string | null;
  dureePrevueJours: number | null;
  dateAssignation: string | null;
  dateDebutExecution: string | null;
  dateFinExecution: string | null;
  dureeReelleHeures: number | null;
  enRetard: boolean;
  statutRetard: string;
}

export interface ManagerSectionDTO {
  managerId: number | null;
  managerNom: string;
  taches: TacheManagerDTO[];
}

export interface EmployeSectionDTO {
  employeId: number;
  employeNom: string;
  tachesAssignees: number;
  tachesDone: number;
  tachesEnRetard: number;
  tachesEnCours: number;
  tachesTodo: number;
  tempsMoyenHeures: number | null;
  tempsEnTodoMinutes: number | null;
  tempsEnInProgressMinutes: number | null;
  tempsDepuisDoneMinutes: number | null;
  tempsTotalMinutes: number | null;
  taches: TacheManagerDTO[];
}

export interface TacheTimelineDTO {
  tacheId: number;
  tacheNom: string;
  employeNom: string | null;
  statut: string;
  dateEcheance: string | null;
  dateAssignation: string | null;
  dateDebutExecution: string | null;
  dateFinExecution: string | null;
  dureePrevueJours: number | null;
  enRetard: boolean;
  progressPourcent: number;
  projetDateDebut: string | null;
  projetDateFin: string | null;
}

export interface ProjetDetailAdminDTO {
  projetId: number;
  projetNom: string;
  clientNom: string | null;
  clientId: number | null;
  statut: string;
  dateDebut: string | null;
  dateFin: string | null;
  typeProjet: string;
  progressionPourcentage: number;
  totalTaches: number;
  tachesDone: number;
  tachesInProgress: number;
  tachesTodo: number;
  tachesEnRetard: number;
  managers: ManagerSectionDTO[];
  employes: EmployeSectionDTO[];
  timeline: TacheTimelineDTO[];
  alertes: AlerteDTO[];
}

export interface AdminDashboardDTO {
  totalProjets: number;
  projetsActifs: number;
  projetsPlanifies: number;
  projetsClotures: number;
  totalTaches: number;
  tachesDone: number;
  tachesInProgress: number;
  tachesTodo: number;
  tachesEnRetard: number;
  progressionMoyenne: number;
  projets: ProjetSummaryDTO[];
  alertes: AlerteDTO[];
}

/* ── API calls ─────────────────────────────────────────────────────────── */

export const adminDashboardProjectService = {
  getDashboard: () =>
    api.get<{ data: AdminDashboardDTO }>('/admin/dashboard'),
  getProjetDetail: (id: number) =>
    api.get<{ data: ProjetDetailAdminDTO }>(`/admin/dashboard/projet/${id}`),
  getAlertes: () =>
    api.get<{ data: AlerteDTO[] }>('/admin/dashboard/alertes'),
};
