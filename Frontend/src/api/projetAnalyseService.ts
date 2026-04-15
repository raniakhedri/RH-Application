import api from './axios';

export interface ProjetAnalyseDTO {
  projetId: number;
  projetNom: string;
  clientNom: string | null;
  statut: string;
  dateOuverture: string | null;
  dateCloture: string | null;
  dureeTotaleMinutes: number | null;
  phaseSetup: {
    dateCreationProjet: string | null;
    dureeSetupMinutes: number | null;
    nombreTaches: number;
    retardDetecte: boolean;
    commentaire: string | null;
  };
  phaseDistribution: {
    managerId: number;
    managerNom: string;
    tacheId: number;
    tacheNom: string;
    dateReception: string | null;
    dateRedistribution: string | null;
    dureeDistributionMinutes: number | null;
    retard: boolean;
  }[];
  phaseExecution: {
    membreId: number;
    membreNom: string;
    tacheId: number;
    tacheNom: string;
    dateAssignation: string | null;
    dateDebutExecution: string | null;
    dateFinExecution: string | null;
    dateEcheance: string | null;
    delaiDemarrage: number | null;
    dureeExecution: number | null;
    statutFinal: string;
    enRetard: boolean;
  }[];
  phaseCloture: {
    dateDerniereTacheDone: string | null;
    dateCloture: string | null;
    delaiCloture: number | null;
    clotureEffectuee: boolean;
  };
  retards: {
    source: string;
    nom: string;
    etape: string;
    dureeRetardMinutes: number | null;
    impact: string;
  }[];
}

export const projetAnalyseService = {
  getRapport: (projetId: number) =>
    api.get<{ data: ProjetAnalyseDTO }>(`/projets/${projetId}/rapport`),
  getAllRapports: () =>
    api.get<{ data: ProjetAnalyseDTO[] }>('/projets/rapports'),
};
