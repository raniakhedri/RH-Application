-- ============================================================
-- Script de données de test complètes pour Antigone RH
-- Base: antigone_rh (PostgreSQL)
-- ============================================================

-- ==========================
-- 1. EMPLOYES (10 employés)
-- ==========================
INSERT INTO employes (matricule, cin, cnss, nom, prenom, email, telephone, date_embauche, solde_conge, poste, type_contrat, genre, departement, rib_bancaire, image_url, manager_id)
VALUES
('EMP001', 'AB123456', 'CNSS001', 'KHEDRI', 'Rania', 'rania.khedri@antigone.tn', '0612345678', '2023-01-15', 30.0, 'Directrice RH', 'CDI', 'FEMME', 'Ressources Humaines', 'TN590100123456789012345678', NULL, NULL),
('EMP002', 'CD789012', 'CNSS002', 'BEN ALI', 'Mohamed', 'mohamed.benali@antigone.tn', '0698765432', '2023-03-01', 24.0, 'Chef de Projet', 'CDI', 'HOMME', 'Informatique', 'TN590200987654321098765432', NULL, NULL),
('EMP003', 'EF345678', 'CNSS003', 'TRABELSI', 'Fatma', 'fatma.trabelsi@antigone.tn', '0655443322', '2023-06-15', 22.0, 'Développeuse Senior', 'CDI', 'FEMME', 'Informatique', 'TN590300111222333444555666', NULL, NULL),
('EMP004', 'GH901234', 'CNSS004', 'GHARBI', 'Ahmed', 'ahmed.gharbi@antigone.tn', '0611223344', '2024-01-10', 18.0, 'Développeur Junior', 'CDD', 'HOMME', 'Informatique', 'TN590400666555444333222111', NULL, NULL),
('EMP005', 'IJ567890', 'CNSS005', 'SASSI', 'Amira', 'amira.sassi@antigone.tn', '0677889900', '2023-09-01', 20.0, 'Designer UI/UX', 'CDI', 'FEMME', 'Design', 'TN590500777888999000111222', NULL, NULL),
('EMP006', 'KL123789', 'CNSS006', 'MAALOUL', 'Youssef', 'youssef.maaloul@antigone.tn', '0633445566', '2024-03-15', 15.0, 'Comptable', 'CDI', 'HOMME', 'Finance', 'TN590600333444555666777888', NULL, NULL),
('EMP007', 'MN456012', 'CNSS007', 'CHAABANE', 'Nour', 'nour.chaabane@antigone.tn', '0699887766', '2023-11-01', 25.0, 'Responsable Marketing', 'CDI', 'FEMME', 'Marketing', 'TN590700444555666777888999', NULL, NULL),
('EMP008', 'OP789345', 'CNSS008', 'HAMDI', 'Karim', 'karim.hamdi@antigone.tn', '0622334455', '2025-01-05', 12.0, 'Stagiaire Dev', 'STAGE', 'HOMME', 'Informatique', 'TN590800555666777888999000', NULL, NULL),
('EMP009', 'QR012678', 'CNSS009', 'FERCHICHI', 'Salma', 'salma.ferchichi@antigone.tn', '0666778899', '2024-06-01', 18.0, 'Assistante RH', 'CDI', 'FEMME', 'Ressources Humaines', 'TN590900666777888999000111', NULL, NULL),
('EMP010', 'ST345901', 'CNSS010', 'JEBALI', 'Omar', 'omar.jebali@antigone.tn', '0644556677', '2024-09-15', 10.0, 'Testeur QA', 'CDD', 'HOMME', 'Informatique', 'TN591000777888999000111222', NULL, NULL);

-- Mise à jour des managers
UPDATE employes SET manager_id = (SELECT id FROM employes WHERE matricule = 'EMP001') WHERE matricule IN ('EMP002', 'EMP006', 'EMP007', 'EMP009');
UPDATE employes SET manager_id = (SELECT id FROM employes WHERE matricule = 'EMP002') WHERE matricule IN ('EMP003', 'EMP004', 'EMP005', 'EMP008', 'EMP010');

-- ==========================
-- 2. ROLES supplémentaires
-- ==========================
INSERT INTO roles (nom) 
SELECT 'MANAGER' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nom = 'MANAGER');
INSERT INTO roles (nom) 
SELECT 'EMPLOYE' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nom = 'EMPLOYE');
INSERT INTO roles (nom) 
SELECT 'RH' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nom = 'RH');

-- ==========================
-- 3. COMPTES (pour tous les employés)
-- ==========================
-- Mot de passe Admin: Admin@2026 | Mot de passe Users: User@2026
INSERT INTO comptes (username, password_hash, enabled, must_change_password, created_at, employe_id)
VALUES
('admin', '$2a$10$somwLEy6hi/OxjWRrpolTOKAXW.ZAMGHpia6obQr.Io1QfLghLme6', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP001')),
('mohamed.benali', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP002')),
('fatma.trabelsi', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP003')),
('ahmed.gharbi', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP004')),
('amira.sassi', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP005')),
('youssef.maaloul', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP006')),
('nour.chaabane', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP007')),
('karim.hamdi', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP008')),
('salma.ferchichi', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP009')),
('omar.jebali', '$2a$10$TLwBHyN9RRsiGf5TlEC96upEwNPJiGxLIqOtNSOes/glDmYmJRxa2', true, false, NOW(), (SELECT id FROM employes WHERE matricule = 'EMP010'));

-- ==========================
-- 4. ATTRIBUTION DES ROLES
-- ==========================
-- Admin (ADMIN + RH)
INSERT INTO compte_roles (compte_id, role_id) VALUES
((SELECT id FROM comptes WHERE username = 'admin'), (SELECT id FROM roles WHERE nom = 'ADMIN')),
((SELECT id FROM comptes WHERE username = 'admin'), (SELECT id FROM roles WHERE nom = 'RH'));

-- Managers
INSERT INTO compte_roles (compte_id, role_id) VALUES
((SELECT id FROM comptes WHERE username = 'mohamed.benali'), (SELECT id FROM roles WHERE nom = 'MANAGER')),
((SELECT id FROM comptes WHERE username = 'nour.chaabane'), (SELECT id FROM roles WHERE nom = 'MANAGER'));

-- RH
INSERT INTO compte_roles (compte_id, role_id) VALUES
((SELECT id FROM comptes WHERE username = 'salma.ferchichi'), (SELECT id FROM roles WHERE nom = 'RH'));

-- Employés
INSERT INTO compte_roles (compte_id, role_id) VALUES
((SELECT id FROM comptes WHERE username = 'fatma.trabelsi'), (SELECT id FROM roles WHERE nom = 'EMPLOYE')),
((SELECT id FROM comptes WHERE username = 'ahmed.gharbi'), (SELECT id FROM roles WHERE nom = 'EMPLOYE')),
((SELECT id FROM comptes WHERE username = 'amira.sassi'), (SELECT id FROM roles WHERE nom = 'EMPLOYE')),
((SELECT id FROM comptes WHERE username = 'youssef.maaloul'), (SELECT id FROM roles WHERE nom = 'EMPLOYE')),
((SELECT id FROM comptes WHERE username = 'karim.hamdi'), (SELECT id FROM roles WHERE nom = 'EMPLOYE')),
((SELECT id FROM comptes WHERE username = 'omar.jebali'), (SELECT id FROM roles WHERE nom = 'EMPLOYE'));

-- ==========================
-- 5. HORAIRES DE TRAVAIL
-- ==========================
INSERT INTO horaires_travail (nom, heure_debut, heure_fin, pause_debut_midi, pause_fin_midi, jours_travail, jours_teletravail, date_debut, date_fin)
VALUES
('Standard 9h-18h', '09:00', '18:00', '12:30', '13:30', 'LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI', NULL, '2023-01-01', NULL),
('Flexible 8h-17h', '08:00', '17:00', '12:00', '13:00', 'LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI', 'MERCREDI,VENDREDI', '2023-01-01', NULL),
('Mi-temps', '09:00', '13:00', NULL, NULL, 'LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI', NULL, '2024-01-01', NULL);

-- ==========================
-- 6. AFFECTATIONS HORAIRE
-- ==========================
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2023-01-15', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP001' AND h.nom = 'Standard 9h-18h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2023-03-01', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP002' AND h.nom = 'Standard 9h-18h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2023-06-15', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP003' AND h.nom = 'Flexible 8h-17h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2024-01-10', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP004' AND h.nom = 'Standard 9h-18h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2023-09-01', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP005' AND h.nom = 'Flexible 8h-17h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2024-03-15', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP006' AND h.nom = 'Standard 9h-18h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2023-11-01', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP007' AND h.nom = 'Standard 9h-18h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2025-01-05', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP008' AND h.nom = 'Mi-temps';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2024-06-01', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP009' AND h.nom = 'Standard 9h-18h';
INSERT INTO affectations_horaire (date_debut, date_fin, employe_id, horaire_travail_id)
SELECT '2024-09-15', NULL, e.id, h.id FROM employes e, horaires_travail h WHERE e.matricule = 'EMP010' AND h.nom = 'Standard 9h-18h';

-- ==========================
-- 7. PROJETS
-- ==========================
INSERT INTO projets (nom, statut, date_debut, date_fin)
VALUES
('Refonte Site Web', 'EN_COURS', '2025-09-01', '2026-06-30'),
('Application Mobile RH', 'PLANIFIE', '2026-04-01', '2026-12-31'),
('Migration Cloud', 'EN_COURS', '2025-06-01', '2026-03-31'),
('Audit Sécurité 2026', 'PLANIFIE', '2026-05-01', '2026-07-31');

-- ==========================
-- 8. EQUIPES
-- ==========================
INSERT INTO equipes (nom, projet_id)
SELECT 'Équipe Frontend', id FROM projets WHERE nom = 'Refonte Site Web';
INSERT INTO equipes (nom, projet_id)
SELECT 'Équipe Backend', id FROM projets WHERE nom = 'Refonte Site Web';
INSERT INTO equipes (nom, projet_id)
SELECT 'Équipe Mobile', id FROM projets WHERE nom = 'Application Mobile RH';
INSERT INTO equipes (nom, projet_id)
SELECT 'Équipe DevOps', id FROM projets WHERE nom = 'Migration Cloud';

-- ==========================
-- 9. MEMBRES DES EQUIPES
-- ==========================
-- Equipe Frontend: Fatma, Amira, Omar
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Frontend' AND e.matricule = 'EMP003';
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Frontend' AND e.matricule = 'EMP005';
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Frontend' AND e.matricule = 'EMP010';

-- Equipe Backend: Ahmed, Karim
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Backend' AND e.matricule = 'EMP004';
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Backend' AND e.matricule = 'EMP008';

-- Equipe Mobile: Fatma, Ahmed
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Mobile' AND e.matricule = 'EMP003';
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe Mobile' AND e.matricule = 'EMP004';

-- Equipe DevOps: Mohamed (chef), Omar
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe DevOps' AND e.matricule = 'EMP002';
INSERT INTO equipe_employes (equipe_id, employe_id)
SELECT eq.id, e.id FROM equipes eq, employes e WHERE eq.nom = 'Équipe DevOps' AND e.matricule = 'EMP010';

-- ==========================
-- 10. TACHES
-- ==========================
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Design maquettes pages principales', 'DONE', '2025-11-15', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Refonte Site Web' AND e.matricule = 'EMP005';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Intégration HTML/CSS responsive', 'IN_PROGRESS', '2026-03-15', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Refonte Site Web' AND e.matricule = 'EMP003';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'API REST employés', 'IN_PROGRESS', '2026-03-20', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Refonte Site Web' AND e.matricule = 'EMP004';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Tests unitaires API', 'TODO', '2026-04-01', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Refonte Site Web' AND e.matricule = 'EMP010';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Configuration CI/CD pipeline', 'IN_PROGRESS', '2026-03-10', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Migration Cloud' AND e.matricule = 'EMP002';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Migration base de données', 'TODO', '2026-03-25', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Migration Cloud' AND e.matricule = 'EMP010';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Prototype app mobile', 'TODO', '2026-05-01', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Application Mobile RH' AND e.matricule = 'EMP003';
INSERT INTO taches (titre, statut, date_echeance, projet_id, assignee_id)
SELECT 'Audit réseau interne', 'TODO', '2026-06-01', p.id, e.id FROM projets p, employes e WHERE p.nom = 'Audit Sécurité 2026' AND e.matricule = 'EMP002';

-- ==========================
-- 11. DEMANDES DE CONGE
-- ==========================
-- Congé approuvé - Fatma
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'CONGE', '2026-01-10 09:00:00', 'APPROUVEE', 'Vacances familiales', id FROM employes WHERE matricule = 'EMP003';
INSERT INTO conges (id, type_conge, date_debut, date_fin, nombre_jours, jours_ouvrables)
SELECT currval('demandes_id_seq'), 'CONGE_PAYE', '2026-02-15', '2026-02-21', 7, 5;

-- Congé en attente - Ahmed
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'CONGE', '2026-02-25 14:30:00', 'EN_ATTENTE', 'Déménagement', id FROM employes WHERE matricule = 'EMP004';
INSERT INTO conges (id, type_conge, date_debut, date_fin, nombre_jours, jours_ouvrables)
SELECT currval('demandes_id_seq'), 'CONGE_EXCEPTIONNEL', '2026-03-10', '2026-03-12', 3, 3;

-- Congé maladie - Amira
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'CONGE', '2026-02-01 08:15:00', 'APPROUVEE', 'Grippe saisonnière', id FROM employes WHERE matricule = 'EMP005';
INSERT INTO conges (id, type_conge, date_debut, date_fin, nombre_jours, jours_ouvrables)
SELECT currval('demandes_id_seq'), 'CONGE_MALADIE', '2026-02-02', '2026-02-04', 3, 3;

-- Congé refusé - Karim
INSERT INTO demandes (type, date_creation, statut, raison, motif_refus, employe_id)
SELECT 'CONGE', '2026-01-20 10:00:00', 'REFUSEE', 'Voyage personnel', 'Période de forte charge - projet en cours', id FROM employes WHERE matricule = 'EMP008';
INSERT INTO conges (id, type_conge, date_debut, date_fin, nombre_jours, jours_ouvrables)
SELECT currval('demandes_id_seq'), 'CONGE_PAYE', '2026-02-01', '2026-02-14', 14, 10;

-- Congé maternité - Nour
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'CONGE', '2026-02-15 09:30:00', 'APPROUVEE', 'Congé maternité', id FROM employes WHERE matricule = 'EMP007';
INSERT INTO conges (id, type_conge, date_debut, date_fin, nombre_jours, jours_ouvrables)
SELECT currval('demandes_id_seq'), 'CONGE_MATERNITE', '2026-04-01', '2026-06-30', 91, 65;

-- ==========================
-- 12. DEMANDES D'AUTORISATION
-- ==========================
-- Autorisation approuvée - Mohamed
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'AUTORISATION', '2026-02-20 08:00:00', 'APPROUVEE', 'Rendez-vous médical', id FROM employes WHERE matricule = 'EMP002';
INSERT INTO autorisations (id, date, heure_debut, heure_fin)
SELECT currval('demandes_id_seq'), '2026-02-22', '10:00', '12:00';

-- Autorisation en attente - Youssef
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'AUTORISATION', '2026-02-28 16:00:00', 'EN_ATTENTE', 'Rendez-vous administratif', id FROM employes WHERE matricule = 'EMP006';
INSERT INTO autorisations (id, date, heure_debut, heure_fin)
SELECT currval('demandes_id_seq'), '2026-03-05', '14:00', '16:00';

-- Autorisation - Salma
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'AUTORISATION', '2026-02-18 09:45:00', 'APPROUVEE', 'Cours de formation', id FROM employes WHERE matricule = 'EMP009';
INSERT INTO autorisations (id, date, heure_debut, heure_fin)
SELECT currval('demandes_id_seq'), '2026-02-20', '08:00', '10:00';

-- ==========================
-- 13. DEMANDES DE TELETRAVAIL
-- ==========================
-- Télétravail approuvé - Fatma
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'TELETRAVAIL', '2026-02-10 11:00:00', 'APPROUVEE', 'Travail sur maquettes depuis la maison', id FROM employes WHERE matricule = 'EMP003';
INSERT INTO teletravails (id, date_debut, date_fin)
SELECT currval('demandes_id_seq'), '2026-03-03', '2026-03-07';

-- Télétravail en attente - Omar
INSERT INTO demandes (type, date_creation, statut, raison, employe_id)
SELECT 'TELETRAVAIL', '2026-02-27 14:00:00', 'EN_ATTENTE', 'Tests depuis domicile', id FROM employes WHERE matricule = 'EMP010';
INSERT INTO teletravails (id, date_debut, date_fin)
SELECT currval('demandes_id_seq'), '2026-03-10', '2026-03-14';

-- ==========================
-- 14. VALIDATIONS
-- ==========================
-- Validation du congé de Fatma (approuvé par Mohamed puis Rania)
INSERT INTO validations (ordre, decision, date_validation, commentaire, demande_id, validateur_id)
SELECT 1, 'APPROUVEE', '2026-01-11 10:00:00', 'OK pour moi', d.id, e.id
FROM demandes d, employes e WHERE d.raison = 'Vacances familiales' AND d.type = 'CONGE' AND e.matricule = 'EMP002';
INSERT INTO validations (ordre, decision, date_validation, commentaire, demande_id, validateur_id)
SELECT 2, 'APPROUVEE', '2026-01-12 09:00:00', 'Validé', d.id, e.id
FROM demandes d, employes e WHERE d.raison = 'Vacances familiales' AND d.type = 'CONGE' AND e.matricule = 'EMP001';

-- Validation du congé d'Ahmed (en attente)
INSERT INTO validations (ordre, decision, demande_id, validateur_id)
SELECT 1, 'EN_ATTENTE', d.id, e.id
FROM demandes d, employes e WHERE d.raison = 'Déménagement' AND d.type = 'CONGE' AND e.matricule = 'EMP002';

-- Validation congé maladie Amira
INSERT INTO validations (ordre, decision, date_validation, commentaire, demande_id, validateur_id)
SELECT 1, 'APPROUVEE', '2026-02-01 12:00:00', 'Bon rétablissement', d.id, e.id
FROM demandes d, employes e WHERE d.raison = 'Grippe saisonnière' AND e.matricule = 'EMP002';

-- Validation refusée Karim
INSERT INTO validations (ordre, decision, date_validation, commentaire, demande_id, validateur_id)
SELECT 1, 'REFUSEE', '2026-01-21 09:00:00', 'Trop de charge en février, reportez svp', d.id, e.id
FROM demandes d, employes e WHERE d.raison = 'Voyage personnel' AND e.matricule = 'EMP002';

-- ==========================
-- 15. POINTAGES (semaine du 24 février 2026)
-- ==========================
DO $$
DECLARE
    emp_rec RECORD;
    jour DATE;
    aff_id BIGINT;
BEGIN
    FOR emp_rec IN SELECT id, matricule FROM employes WHERE matricule IN ('EMP001','EMP002','EMP003','EMP004','EMP005','EMP006','EMP009','EMP010') LOOP
        SELECT ah.id INTO aff_id FROM affectations_horaire ah WHERE ah.employe_id = emp_rec.id LIMIT 1;
        FOR jour IN SELECT generate_series('2026-02-23'::date, '2026-02-27'::date, '1 day'::interval)::date LOOP
            INSERT INTO pointages (date_jour, heure_entree, heure_sortie, statut, source, employe_id, affectation_horaire_id)
            VALUES (
                jour,
                CASE 
                    WHEN emp_rec.matricule = 'EMP004' AND jour = '2026-02-25' THEN '09:45'::time
                    WHEN emp_rec.matricule = 'EMP008' THEN '09:00'::time
                    ELSE '08:55'::time 
                END,
                CASE 
                    WHEN emp_rec.matricule = 'EMP004' AND jour = '2026-02-25' THEN '18:00'::time
                    WHEN emp_rec.matricule = 'EMP008' THEN '13:00'::time
                    ELSE '18:05'::time 
                END,
                CASE 
                    WHEN emp_rec.matricule = 'EMP004' AND jour = '2026-02-25' THEN 'RETARD'
                    ELSE 'PRESENT' 
                END,
                'AUTOMATIQUE',
                emp_rec.id,
                aff_id
            );
        END LOOP;
    END LOOP;
END $$;

-- Pointage absent pour Nour (en congé maternité) et Karim (absent un jour)
INSERT INTO pointages (date_jour, heure_entree, heure_sortie, statut, source, employe_id, affectation_horaire_id)
SELECT '2026-02-25', NULL, NULL, 'ABSENT', 'AUTOMATIQUE', e.id, ah.id
FROM employes e LEFT JOIN affectations_horaire ah ON ah.employe_id = e.id WHERE e.matricule = 'EMP008';

-- ==========================
-- 16. CALENDRIER (Mars 2026)
-- ==========================
INSERT INTO calendrier (date_jour, nom_jour, type_jour, origine, description, est_paye) VALUES
('2026-03-01', 'Dimanche', 'FERIE', NULL, 'Week-end', true),
('2026-03-02', 'Lundi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-03', 'Mardi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-04', 'Mercredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-05', 'Jeudi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-06', 'Vendredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-07', 'Samedi', 'FERIE', NULL, 'Week-end', true),
('2026-03-08', 'Dimanche', 'FERIE', NULL, 'Week-end', true),
('2026-03-09', 'Lundi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-10', 'Mardi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-11', 'Mercredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-12', 'Jeudi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-13', 'Vendredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-14', 'Samedi', 'FERIE', NULL, 'Week-end', true),
('2026-03-15', 'Dimanche', 'FERIE', NULL, 'Week-end', true),
('2026-03-16', 'Lundi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-17', 'Mardi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-18', 'Mercredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-19', 'Jeudi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-20', 'Vendredi', 'FERIE', 'NATIONAL', 'Fête de l''indépendance', true),
('2026-03-21', 'Samedi', 'FERIE', NULL, 'Week-end', true),
('2026-03-22', 'Dimanche', 'FERIE', NULL, 'Week-end', true),
('2026-03-23', 'Lundi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-24', 'Mardi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-25', 'Mercredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-26', 'Jeudi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-27', 'Vendredi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-28', 'Samedi', 'FERIE', NULL, 'Week-end', true),
('2026-03-29', 'Dimanche', 'FERIE', NULL, 'Week-end', true),
('2026-03-30', 'Lundi', 'OUVRABLE', NULL, 'Jour ouvrable', true),
('2026-03-31', 'Mardi', 'OUVRABLE', NULL, 'Jour ouvrable', true);

-- Jours fériés nationaux 2026
INSERT INTO calendrier (date_jour, nom_jour, type_jour, origine, description, est_paye) VALUES
('2026-01-01', 'Jeudi', 'FERIE', 'INTERNATIONAL', 'Jour de l''an', true),
('2026-01-14', 'Mercredi', 'FERIE', 'NATIONAL', 'Fête de la révolution', true),
('2026-04-09', 'Jeudi', 'FERIE', 'NATIONAL', 'Fête des martyrs', true),
('2026-05-01', 'Vendredi', 'FERIE', 'INTERNATIONAL', 'Fête du travail', true),
('2026-07-25', 'Samedi', 'FERIE', 'NATIONAL', 'Fête de la République', true),
('2026-08-13', 'Jeudi', 'FERIE', 'NATIONAL', 'Fête de la femme', true);

-- ==========================
-- 17. PERIODES BLOQUEES
-- ==========================
INSERT INTO periodes_bloquees (date_debut, date_fin, nb_min_employes, raison, cree_par_id)
SELECT '2026-06-15', '2026-06-30', 5, 'Clôture projet Refonte Site Web - présence obligatoire', id FROM employes WHERE matricule = 'EMP001';
INSERT INTO periodes_bloquees (date_debut, date_fin, nb_min_employes, raison, cree_par_id)
SELECT '2026-12-20', '2026-12-31', 3, 'Clôture annuelle comptabilité', id FROM employes WHERE matricule = 'EMP001';

-- ==========================
-- 18. NOTIFICATIONS
-- ==========================
INSERT INTO notifications (titre, message, lu, date_creation, employe_id, demande_id)
SELECT 'Congé approuvé', 'Votre demande de congé du 15/02 au 21/02 a été approuvée.', true, '2026-01-12 09:30:00', e.id, d.id
FROM employes e, demandes d WHERE e.matricule = 'EMP003' AND d.raison = 'Vacances familiales';

INSERT INTO notifications (titre, message, lu, date_creation, employe_id, demande_id)
SELECT 'Nouvelle demande à valider', 'Ahmed GHARBI a soumis une demande de congé exceptionnel.', false, '2026-02-25 14:35:00', e.id, d.id
FROM employes e, demandes d WHERE e.matricule = 'EMP002' AND d.raison = 'Déménagement';

INSERT INTO notifications (titre, message, lu, date_creation, employe_id, demande_id)
SELECT 'Congé refusé', 'Votre demande de congé du 01/02 au 14/02 a été refusée. Motif: Période de forte charge.', true, '2026-01-21 09:30:00', e.id, d.id
FROM employes e, demandes d WHERE e.matricule = 'EMP008' AND d.raison = 'Voyage personnel';

INSERT INTO notifications (titre, message, lu, date_creation, employe_id)
VALUES
('Bienvenue', 'Bienvenue sur la plateforme Antigone RH ! Votre compte a été créé avec succès.', true, '2026-01-01 08:00:00', (SELECT id FROM employes WHERE matricule = 'EMP001')),
('Bienvenue', 'Bienvenue sur la plateforme Antigone RH ! Votre compte a été créé.', true, '2026-01-01 08:00:00', (SELECT id FROM employes WHERE matricule = 'EMP002')),
('Rappel pointage', 'N''oubliez pas de pointer votre arrivée chaque matin.', false, '2026-03-01 08:00:00', (SELECT id FROM employes WHERE matricule = 'EMP004')),
('Nouvelle tâche assignée', 'Vous avez été assigné(e) à la tâche: Tests unitaires API', false, '2026-02-28 10:00:00', (SELECT id FROM employes WHERE matricule = 'EMP010'));

-- ==========================
-- 19. REFERENTIELS supplémentaires
-- ==========================
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Informatique', 'Département IT', true, NULL, 'DEPARTEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Informatique' AND type_referentiel = 'DEPARTEMENT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Ressources Humaines', 'Département RH', true, NULL, 'DEPARTEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Ressources Humaines' AND type_referentiel = 'DEPARTEMENT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Finance', 'Département Finance et Comptabilité', true, NULL, 'DEPARTEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Finance' AND type_referentiel = 'DEPARTEMENT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Marketing', 'Département Marketing et Communication', true, NULL, 'DEPARTEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Marketing' AND type_referentiel = 'DEPARTEMENT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Design', 'Département Design et UX', true, NULL, 'DEPARTEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Design' AND type_referentiel = 'DEPARTEMENT');

INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'CDI', 'Contrat à Durée Indéterminée', true, NULL, 'TYPE_CONTRAT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'CDI' AND type_referentiel = 'TYPE_CONTRAT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'CDD', 'Contrat à Durée Déterminée', true, NULL, 'TYPE_CONTRAT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'CDD' AND type_referentiel = 'TYPE_CONTRAT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'STAGE', 'Convention de Stage', true, NULL, 'TYPE_CONTRAT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'STAGE' AND type_referentiel = 'TYPE_CONTRAT');

INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Siège Tunis', 'Bureau principal à Tunis', true, NULL, 'SITE_ETABLISSEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Siège Tunis' AND type_referentiel = 'SITE_ETABLISSEMENT');
INSERT INTO referentiels (libelle, description, actif, valeur, type_referentiel)
SELECT 'Annexe Sfax', 'Bureau annexe à Sfax', true, NULL, 'SITE_ETABLISSEMENT' WHERE NOT EXISTS (SELECT 1 FROM referentiels WHERE libelle = 'Annexe Sfax' AND type_referentiel = 'SITE_ETABLISSEMENT');

-- ==========================
-- 20. HISTORIQUE STATUTS
-- ==========================
INSERT INTO historique_statuts (ancien_statut, nouveau_statut, date_changement, demande_id, modifie_par_id, commentaire)
SELECT 'EN_ATTENTE', 'APPROUVEE', '2026-01-12 09:00:00', d.id, e.id, 'Approuvé par la DRH'
FROM demandes d, employes e WHERE d.raison = 'Vacances familiales' AND e.matricule = 'EMP001';

INSERT INTO historique_statuts (ancien_statut, nouveau_statut, date_changement, demande_id, modifie_par_id, commentaire)
SELECT 'EN_ATTENTE', 'REFUSEE', '2026-01-21 09:00:00', d.id, e.id, 'Refusé - forte charge en février'
FROM demandes d, employes e WHERE d.raison = 'Voyage personnel' AND e.matricule = 'EMP002';

-- ==========================
-- FIN DU SCRIPT
-- ==========================
SELECT 'Données de test insérées avec succès !' AS resultat;
