ALTER TABLE equipes ALTER COLUMN projet_id DROP NOT NULL;

-- Nettoyer les colonnes orphelines des autres tables
ALTER TABLE heartbeats DROP COLUMN IF EXISTS created_at;
ALTER TABLE presence_confirmations DROP COLUMN IF EXISTS created_at;
