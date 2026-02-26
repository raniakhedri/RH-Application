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

export enum TypeJour {
  OUVRABLE = 'OUVRABLE',
  FERIE = 'FERIE',
  CONGE_PAYE = 'CONGE_PAYE',
  CONGE_NON_PAYE = 'CONGE_NON_PAYE',
}

export enum OrigineJour {
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
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
  raisonAnnulation?: string;
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
  chefDeProjet?: Employe | null;
  equipeId?: number | null;
  equipeNoms?: string[];
}

export interface Equipe {
  id: number;
  nom: string;
  projetId: number;
  membres: Employe[];
}

export interface EquipeCreateRequest {
  nom: string;
  projetId: number | null;
  memberIds: number[];
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

// =====================
// REFERENTIELS
// =====================
export enum TypeReferentiel {
  DEPARTEMENT = 'DEPARTEMENT',
  TYPE_CONTRAT = 'TYPE_CONTRAT',
  SITE_ETABLISSEMENT = 'SITE_ETABLISSEMENT',
  POSTE = 'POSTE',
  NIVEAU_HIERARCHIQUE = 'NIVEAU_HIERARCHIQUE',
  TYPE_CONGE = 'TYPE_CONGE',
  TYPE_DEMANDE = 'TYPE_DEMANDE',
  GENRE = 'GENRE',
}

export const TypeReferentielLabels: Record<TypeReferentiel, string> = {
  [TypeReferentiel.DEPARTEMENT]: 'Département',
  [TypeReferentiel.TYPE_CONTRAT]: 'Type contrat',
  [TypeReferentiel.SITE_ETABLISSEMENT]: 'Site / Établissement',
  [TypeReferentiel.POSTE]: 'Poste',
  [TypeReferentiel.NIVEAU_HIERARCHIQUE]: 'Niveau hiérarchique',
  [TypeReferentiel.TYPE_CONGE]: 'Type congé',
  [TypeReferentiel.TYPE_DEMANDE]: 'Type demande',
  [TypeReferentiel.GENRE]: 'Genre',
};

export interface Referentiel {
  id: number;
  libelle: string;
  description: string;
  actif: boolean;
  typeReferentiel: string;
  typeReferentielLabel: string;
}

export interface ReferentielRequest {
  libelle: string;
  description: string;
  typeReferentiel: string;
}

// =====================
// CALENDRIER
// =====================
export interface CalendrierJour {
  id: number;
  dateJour: string;
  nomJour: string;
  typeJour: TypeJour;
  origine: OrigineJour | null;
  description: string | null;
  estPaye: boolean;
}

export interface CalendrierRequest {
  dateJour: string;
  nomJour: string;
  typeJour: TypeJour;
  origine: OrigineJour | null;
  description: string;
  estPaye: boolean;
}

export interface HoraireTravail {
  id: number;
  nom: string;
  heureDebut: string;
  heureFin: string;
  pauseDebutMidi: string | null;
  pauseFinMidi: string | null;
  joursTravail: string;
}

export interface HoraireTravailRequest {
  nom: string;
  heureDebut: string;
  heureFin: string;
  pauseDebutMidi: string | null;
  pauseFinMidi: string | null;
  joursTravail: string;
}

export interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: SidebarItem[];
}
