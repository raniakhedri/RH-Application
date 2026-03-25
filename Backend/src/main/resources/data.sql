ALTER TABLE equipes ALTER COLUMN projet_id DROP NOT NULL;

-- Nettoyer les colonnes orphelines des autres tables
ALTER TABLE heartbeats DROP COLUMN IF EXISTS created_at;
ALTER TABLE presence_confirmations DROP COLUMN IF EXISTS created_at;

-- Corriger les heures avec des fractions de secondes qui causent des erreurs JDBC
UPDATE pointages SET heure_entree = date_trunc('second', heure_entree) WHERE heure_entree IS NOT NULL;
UPDATE pointages SET heure_sortie = date_trunc('second', heure_sortie) WHERE heure_sortie IS NOT NULL;
