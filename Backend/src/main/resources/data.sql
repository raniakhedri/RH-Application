ALTER TABLE equipes ALTER COLUMN projet_id DROP NOT NULL;

-- Nettoyer les colonnes orphelines des autres tables
ALTER TABLE heartbeats DROP COLUMN IF EXISTS created_at;
ALTER TABLE presence_confirmations DROP COLUMN IF EXISTS created_at;

-- Corriger les heures avec des fractions de secondes qui causent des erreurs JDBC
UPDATE pointages SET heure_entree = date_trunc('second', heure_entree) WHERE heure_entree IS NOT NULL;
UPDATE pointages SET heure_sortie = date_trunc('second', heure_sortie) WHERE heure_sortie IS NOT NULL;

-- Drop the PostgreSQL check constraint on type_referentiel so new enum values work
ALTER TABLE referentiels DROP CONSTRAINT IF EXISTS referentiels_type_referentiel_check;

-- Media Plan permissions
INSERT INTO permissions (permission) SELECT 'VIEW_MEDIA_PLAN' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission = 'VIEW_MEDIA_PLAN');
INSERT INTO permissions (permission) SELECT 'VIEW_TOUS_MEDIA_PLAN' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission = 'VIEW_TOUS_MEDIA_PLAN');

-- Remove old client validation columns
ALTER TABLE clients DROP COLUMN IF EXISTS ceo_validated;
ALTER TABLE clients DROP COLUMN IF EXISTS coo_validated;
ALTER TABLE clients DROP COLUMN IF EXISTS da_validated;

-- Project permissions
INSERT INTO permissions (permission) SELECT 'MANAGE_ALL_PROJETS' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission = 'MANAGE_ALL_PROJETS');
INSERT INTO permissions (permission) SELECT 'VIEW_PROJETS_CREATE_TACHES' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission = 'VIEW_PROJETS_CREATE_TACHES');

-- Allow EN_ATTENTE_CLIENT as a valid media plan status (drop old 3-value constraint, add updated 4-value one)
ALTER TABLE media_plans DROP CONSTRAINT IF EXISTS media_plans_statut_check;
ALTER TABLE media_plans ADD CONSTRAINT media_plans_statut_check CHECK (statut IN ('EN_ATTENTE', 'EN_ATTENTE_CLIENT', 'APPROUVE', 'DESAPPROUVE'));
