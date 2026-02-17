// =====================
// ENUMS
// =====================
export enum StatutDemande {
  BROUILLON = 'BROUILLON',
  SOUMISE = 'SOUMISE',
  EN_VALIDATION = 'EN_VALIDATION',
  VALIDEE = 'VALIDEE',
  REFUSEE = 'REFUSEE',
  ANNULEE = 'ANNULEE',
}

export enum TypeDemande {
  CONGE = 'CONGE',
  AUTORISATION = 'AUTORISATION',
  TELETRAVAIL = 'TELETRAVAIL',
  ADMINISTRATION = 'ADMINISTRATION',
}

export enum DecisionValidation {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVEE = 'APPROUVEE',
  REFUSEE = 'REFUSEE',
}

export enum StatutProjet {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE',
  ANNULE = 'ANNULE',
}

export enum StatutTache {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum StatutPointage {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  RETARD = 'RETARD',
  INCOMPLET = 'INCOMPLET',
}

export enum SourcePointage {
  MANUEL = 'MANUEL',
  AUTOMATIQUE = 'AUTOMATIQUE',
}

// =====================
// INTERFACES
// =====================
export interface Employe {
  id: number;
  matricule: string;
  cin: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateEmbauche: string;
  soldeConge: number;
  managerId: number | null;
  managerNom: string | null;
}

export interface Compte {
  id: number;
  username: string;
  enabled: boolean;
  employeId: number;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  employeId: number;
  username: string;
  nom: string;
  prenom: string;
  email: string;
  roles: string[];
  message: string;
}

export interface DemandeRequest {
  type: TypeDemande;
  raison: string;
  employeId: number;
  dateDebut?: string;
  dateFin?: string;
  date?: string;
  heureDebut?: string;
  heureFin?: string;
}

export interface DemandeResponse {
  id: number;
  type: TypeDemande;
  dateCreation: string;
  statut: StatutDemande;
  raison: string;
  employeId: number;
  employeNom: string;
  dateDebut?: string;
  dateFin?: string;
  date?: string;
  heureDebut?: string;
  heureFin?: string;
}

export interface Validation {
  id: number;
  ordre: number;
  decision: DecisionValidation;
  dateValidation: string | null;
  commentaire: string | null;
  demandeId: number;
  validateurId: number;
}

export interface ValidationRequest {
  demandeId: number;
  validateurId: number;
  ordre: number;
  decision: DecisionValidation;
  commentaire: string;
}

export interface Pointage {
  id: number;
  dateJour: string;
  heureEntree: string | null;
  heureSortie: string | null;
  statut: StatutPointage;
  source: SourcePointage;
  employeId: number;
}

export interface Projet {
  id: number;
  nom: string;
  statut: StatutProjet;
  dateDebut: string;
  dateFin: string;
}

export interface Equipe {
  id: number;
  nom: string;
  projetId: number;
  membres: Employe[];
}

export interface Tache {
  id: number;
  titre: string;
  statut: StatutTache;
  dateEcheance: string;
  projetId: number;
  assigneeId: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

export interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: SidebarItem[];
}
