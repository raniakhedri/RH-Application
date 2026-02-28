# 📘 Documentation Complète — Antigone RH

## Application de Gestion des Ressources Humaines

**Version** : 1.0.0  
**Entreprise** : Antigone Creative Agency  
**Date de documentation** : Février 2026

---

## Table des matières

1. [Présentation Générale](#1-présentation-générale)
2. [Architecture Technique](#2-architecture-technique)
3. [Installation & Configuration](#3-installation--configuration)
4. [Modèle de Données](#4-modèle-de-données)
5. [Modules Fonctionnels](#5-modules-fonctionnels)
   - 5.1 [Authentification & Comptes](#51-authentification--comptes)
   - 5.2 [Gestion des Employés](#52-gestion-des-employés)
   - 5.3 [Gestion des Congés](#53-gestion-des-congés)
   - 5.4 [Gestion des Autorisations](#54-gestion-des-autorisations)
   - 5.5 [Gestion du Télétravail](#55-gestion-du-télétravail)
   - 5.6 [Calendrier & Horaires](#56-calendrier--horaires)
   - 5.7 [Pointage](#57-pointage)
   - 5.8 [Projets & Tâches](#58-projets--tâches)
   - 5.9 [Équipes](#59-équipes)
   - 5.10 [Validation Multi-Niveaux](#510-validation-multi-niveaux)
   - 5.11 [Notifications](#511-notifications)
   - 5.12 [Référentiels](#512-référentiels)
   - 5.13 [Tableau de Bord](#513-tableau-de-bord)
6. [Règles Métier Détaillées](#6-règles-métier-détaillées)
7. [API REST — Catalogue des Endpoints](#7-api-rest--catalogue-des-endpoints)
8. [Interface Utilisateur — Pages](#8-interface-utilisateur--pages)
9. [Sécurité & Rôles](#9-sécurité--rôles)
10. [Structure du Projet](#10-structure-du-projet)

---

## 1. Présentation Générale

**Antigone RH** est une application complète de gestion des ressources humaines conçue pour l'agence créative Antigone. Elle couvre l'ensemble du cycle de vie RH :

- **Gestion des employés** : fiche employé, hiérarchie managériale, solde congés
- **Gestion des demandes** : congés (12 types), autorisations d'absence, télétravail
- **Calcul intelligent des jours** : prise en compte des jours fériés, week-ends, ponts
- **Pointage** : suivi du temps de travail (entrée/sortie) avec détection retard/incomplet
- **Projets & tâches** : gestion de projet avec Kanban, affectation d'équipes
- **Calendrier d'entreprise** : jours fériés, horaires de travail, télétravail entreprise
- **Workflow de validation** : validation multi-niveaux des demandes
- **Système de notifications** : alertes en temps réel pour les employés
- **Référentiels paramétrables** : configuration centralisée du système

---

## 2. Architecture Technique

### Stack Technologique

| Couche | Technologie | Version |
|--------|------------|---------|
| **Backend** | Spring Boot | 3.2.5 |
| **Langage** | Java | 17 |
| **Base de données** | PostgreSQL | 18 |
| **ORM** | Hibernate / Spring Data JPA | — |
| **Sécurité** | Spring Security + BCrypt | — |
| **Build** | Maven Wrapper | — |
| **Frontend** | React | 19.2.4 |
| **Bundler** | Vite | 7.3.1 |
| **Langage** | TypeScript | 5.9.3 |
| **CSS** | Tailwind CSS | 4.1.18 |
| **Graphiques** | Recharts | 3.7.0 |
| **Icônes** | React Icons | 5.5.0 |
| **Routing** | React Router DOM | 7.13.0 |
| **HTTP Client** | Axios | 1.13.5 |

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│              http://localhost:5173                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Pages   │  │Components│  │  API Services     │   │
│  │  (14)    │  │ (Layout) │  │  (Axios → /api)   │   │
│  └──────────┘  └──────────┘  └────────┬─────────┘   │
└───────────────────────────────────────┼──────────────┘
                                        │ HTTP REST
                                        ▼
┌──────────────────────────────────────────────────────┐
│                  Backend (Spring Boot)                │
│              http://localhost:8080/api                 │
│  ┌────────────┐ ┌────────────┐ ┌───────────────┐    │
│  │Controllers │→│ Services   │→│ Repositories   │    │
│  │   (11)     │ │   (12)     │ │    (JPA)       │    │
│  └────────────┘ └────────────┘ └───────┬───────┘    │
└────────────────────────────────────────┼─────────────┘
                                         │ JDBC
                                         ▼
                              ┌────────────────────┐
                              │   PostgreSQL 18     │
                              │   antigone_rh       │
                              └────────────────────┘
```

### Ports & URLs

| Service | URL |
|---------|-----|
| Frontend (dev) | `http://localhost:5173` |
| Backend API | `http://localhost:8080/api` |
| PostgreSQL | `localhost:5432/antigone_rh` |

---

## 3. Installation & Configuration

### Prérequis

- **Java 17** (Eclipse Adoptium / Temurin recommandé)
- **PostgreSQL 18**
- **Node.js 18+** avec npm
- **Git**

### Configuration Backend

Fichier : `Backend/src/main/resources/application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/antigone_rh
    username: postgres
    password: raniakhedri
  jpa:
    hibernate:
      ddl-auto: update    # Création/mise à jour automatique du schéma
    show-sql: true
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

app:
  upload:
    dir: uploads/justificatifs
```

### Lancement

```bash
# 1. Créer la base de données PostgreSQL
createdb antigone_rh

# 2. Démarrer le Backend
cd Backend
./mvnw spring-boot:run

# 3. Démarrer le Frontend
cd Frontend
npm install
npm run dev
```

### Données initiales (DataInitializer)

Au démarrage, le système crée automatiquement les paramètres système suivants dans la table `referentiels` :

| Paramètre | Valeur par défaut | Description |
|-----------|-------------------|-------------|
| `MAX_AUTORISATION_MINUTES` | 120 | Quota mensuel d'autorisation (minutes) |
| `SOLDE_CONGE_AN1` | 18 | Droit annuel congé — 1ère année |
| `SOLDE_CONGE_AN2_PLUS` | 24 | Droit annuel congé — 2ème année+ |
| `TAUX_MENSUEL_AN1` | 1.5 | Taux d'acquisition mensuel — 1ère année |
| `TAUX_MENSUEL_AN2_PLUS` | 2.0 | Taux d'acquisition mensuel — 2ème année+ |
| `MAX_REPORT_CONGE` | 5 | Maximum de jours reportables |
| `HEURE_DEBUT_TRAVAIL` | 08:00 | Heure de début de travail |
| `HEURE_FIN_TRAVAIL` | 18:00 | Heure de fin de travail |
| `JOURS_TRAVAIL` | LUNDI–VENDREDI | Jours ouvrés |

---

## 4. Modèle de Données

### 4.1 Diagramme des Entités

```
                    ┌──────────────┐
                    │   Employe    │
                    │──────────────│
                    │ matricule    │
                    │ cin          │
                    │ nom, prenom  │
                    │ email        │
                    │ telephone    │
                    │ dateEmbauche │
                    │ soldeConge   │
                    │ sexe         │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────────┐
   │  Compte  │    │ Demande  │    │  Pointage    │
   │──────────│    │──────────│    │──────────────│
   │ username │    │ type     │    │ dateJour     │
   │ password │    │ statut   │    │ heureEntree  │
   │ enabled  │    │ raison   │    │ heureSortie  │
   │ roles    │    │ motifRef │    │ statut       │
   └──────────┘    └────┬─────┘    └──────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      ┌────────┐  ┌───────────┐  ┌──────────┐
      │ Conge  │  │Autorisation│  │Teletravail│
      │────────│  │───────────│  │──────────│
      │typeConge│  │ date      │  │dateDebut │
      │dateDebut│  │ heureDebut│  │dateFin   │
      │dateFin  │  │ heureFin  │  └──────────┘
      │nbrJours │  └───────────┘
      │justific.│
      └────────┘
```

### 4.2 Entités Principales

#### Employe
| Champ | Type | Description |
|-------|------|-------------|
| `id` | Long | Identifiant auto-généré |
| `matricule` | String | Numéro matricule (unique) |
| `cin` | String | Carte d'identité nationale (unique) |
| `nom` | String | Nom de famille |
| `prenom` | String | Prénom |
| `email` | String | Email professionnel (unique) |
| `telephone` | String | Numéro de téléphone |
| `dateEmbauche` | LocalDate | Date d'embauche (calcul ancienneté) |
| `soldeConge` | Double | Solde congé disponible (auto-calculé) |
| `sexe` | Enum | HOMME / FEMME |
| `manager` | Employe | Référence au supérieur hiérarchique |

#### Demande (Héritage JOINED)
| Champ | Type | Description |
|-------|------|-------------|
| `id` | Long | Identifiant |
| `type` | TypeDemande | CONGE / AUTORISATION / TELETRAVAIL / ADMINISTRATION |
| `dateCreation` | LocalDateTime | Date de soumission (auto) |
| `statut` | StatutDemande | EN_ATTENTE / APPROUVEE / REFUSEE / ANNULEE |
| `raison` | String | Motif de la demande |
| `motifRefus` | String | Raison du refus (si refusée) |
| `employe` | Employe | Employé demandeur |

#### Conge (extends Demande)
| Champ | Type | Description |
|-------|------|-------------|
| `typeConge` | TypeConge | Type de congé (12 types) |
| `dateDebut` | LocalDate | Date de début |
| `dateFin` | LocalDate | Date de fin |
| `nombreJours` | Integer | Nombre total de jours (avec extensions) |
| `joursOuvrables` | Integer | Jours ouvrables uniquement (pour déduction solde) |
| `justificatifPath` | String | Chemin du fichier justificatif |

#### Autorisation (extends Demande)
| Champ | Type | Description |
|-------|------|-------------|
| `date` | LocalDate | Date de l'autorisation |
| `heureDebut` | LocalTime | Heure de début |
| `heureFin` | LocalTime | Heure de fin |

#### Teletravail (extends Demande)
| Champ | Type | Description |
|-------|------|-------------|
| `dateDebut` | LocalDate | Date de début |
| `dateFin` | LocalDate | Date de fin |

### 4.3 Énumérations

#### TypeConge — 12 types de congé
| Valeur | Libellé | Contraintes |
|--------|---------|-------------|
| `CONGE_PAYE` | Congé payé | Déduction du solde, règle 4× |
| `CONGE_MALADIE` | Congé maladie | Max 2 jours ouvrables, justificatif obligatoire |
| `CONGE_MATERNITE` | Congé maternité | Justificatif obligatoire, femmes uniquement |
| `CONGE_PATERNITE` | Congé paternité | — |
| `CONGE_SANS_SOLDE` | Congé sans solde | Pas de déduction du solde |
| `CONGE_EXCEPTIONNEL` | Congé exceptionnel | Exempt règle 4× |
| `CONGE_FORMATION` | Congé formation | — |
| `CONGE_RECUPERATION` | Congé récupération | — |
| `CONGE_ADMINISTRATIF` | Congé administratif | — |
| `CONGE_REGLES` | Congé règles | Max 1 jour ouvrable, femmes uniquement |
| `CONGE_DECES_PROCHE` | Congé décès (proche) | Fixe 5 jours, justificatif obligatoire |
| `CONGE_DECES_FAMILLE` | Congé décès (famille) | Fixe 1 jour, justificatif obligatoire |

#### StatutDemande
`EN_ATTENTE` → `APPROUVEE` | `REFUSEE` | `ANNULEE`

#### TypeJour
`OUVRABLE` | `FERIE` | `CONGE_PAYE` | `CONGE_NON_PAYE` | `TELETRAVAIL`

#### StatutProjet
`PLANIFIE` → `EN_COURS` → `CLOTURE` | `ANNULE`

#### StatutTache
`TODO` → `IN_PROGRESS` → `DONE`

#### StatutPointage
`PRESENT` | `ABSENT` | `RETARD` | `INCOMPLET`

#### TypeReferentiel
`DEPARTEMENT` | `TYPE_CONTRAT` | `SITE_ETABLISSEMENT` | `POSTE` | `NIVEAU_HIERARCHIQUE` | `TYPE_CONGE` | `TYPE_DEMANDE` | `GENRE` | `PARAMETRE_SYSTEME`

---

## 5. Modules Fonctionnels

### 5.1 Authentification & Comptes

#### Description
Système d'authentification par nom d'utilisateur et mot de passe avec hachage BCrypt.

#### Fonctionnalités
- **Connexion** : Authentification avec `username` + `password`
- **Création de compte** : Lié à un employé existant, avec attribution de rôle
- **Activation/Désactivation** : Les comptes peuvent être activés ou désactivés
- **Rôles** : SUPER_ADMIN, EMPLOYE (extensible)
- **Genre dans la réponse** : Le sexe de l'employé est inclus dans la réponse login pour le filtrage côté frontend

#### Flux de connexion
```
Utilisateur → LoginPage → authService.login() → POST /api/auth/login
                                                      │
                            ┌─────────────────────────┘
                            ▼
                    Vérification BCrypt → Compte actif ?
                            │                    │
                           Oui                  Non
                            ▼                    ▼
                     LoginResponse          "Compte désactivé"
                     (id, nom, prénom,
                      email, roles, sexe)
                            │
                            ▼
                    AuthContext → Redirect /dashboard
```

---

### 5.2 Gestion des Employés

#### Description
CRUD complet des fiches employés avec gestion hiérarchique et calcul automatique du solde congé.

#### Fonctionnalités
- **Création** : Matricule (unique), CIN, nom, prénom, email, téléphone, date d'embauche, sexe, manager
- **Modification** : Tous les champs, recalcul automatique du solde
- **Suppression** : Avec confirmation
- **Recherche** : Par nom, prénom, matricule, email
- **Hiérarchie** : Lien manager-subordonné (auto-référence)
- **Solde congé** : Calculé automatiquement depuis la date d'embauche

#### Interface
- Tableau de données avec pagination
- Avatars avec initiales
- Modal de création/édition en 2 colonnes
- Badge coloré pour le solde congé

---

### 5.3 Gestion des Congés

#### Description
Module central de gestion des demandes de congé avec 12 types, calcul intelligent des jours, filtrage par genre, et contrôle du solde.

#### Types de congé disponibles

| Type | Durée max | Justificatif | Solde | Avance 4× | Genre |
|------|-----------|--------------|-------|-----------|-------|
| Congé payé | Selon solde | Non | Déduit | Oui | Tous |
| Congé maladie | 2 jours ouv. | Certificat médical | Non | Non | Tous |
| Congé maternité | — | Certificat médical | Non | Non | Femme |
| Congé paternité | — | Non | Non | Oui | Homme |
| Congé sans solde | — | Non | Non | Oui | Tous |
| Congé exceptionnel | — | Non | Non | Non | Tous |
| Congé formation | — | Non | Non | Oui | Tous |
| Congé récupération | — | Non | Non | Oui | Tous |
| Congé administratif | — | Non | Non | Oui | Tous |
| Congé règles | 1 jour ouv. | Non | Non | Non | Femme |
| Congé décès (proche) | 5 jours fixe | Attestation de décès | Non | Non | Tous |
| Congé décès (famille) | 1 jour fixe | Attestation de décès | Non | Non | Tous |

#### Processus de création d'une demande de congé
```
1. Sélection du type de congé (filtré par sexe)
2. Saisie des dates début/fin
3. Calcul automatique des jours effectifs (API)
    ├── Exclusion week-ends + jours fériés
    ├── Extension avant (pont/bridge)
    └── Extension après (week-end/bridge suivant)
4. Validations :
    ├── Règle 4× (délai d'anticipation)
    ├── Limites par type (maladie ≤2j, règles ≤1j)
    ├── Vérification solde (congé payé)
    ├── Contrôle chevauchement
    ├── Vendredi seul → congé sans solde obligatoire
    └── Justificatif obligatoire si requis
5. Upload du justificatif (PDF, JPG, PNG, DOC)
6. Soumission → statut EN_ATTENTE
7. Notification à l'admin
```

#### Mini-Calendrier
Lors de la création, un mini-calendrier affiche :
- 🔴 Jours fériés
- ⬜ Jours de repos (non travaillés)
- 🔵 Période sélectionnée
- Liste des jours fériés du mois courant

---

### 5.4 Gestion des Autorisations

#### Description
Demandes d'absence courte (en heures) pendant les horaires de travail.

#### Contraintes
- **Durée max** : Paramètre système `MAX_AUTORISATION_MINUTES` (défaut : 120 min = 2h)
- **Jour ouvré** : La date doit être un jour de travail (référentiel `JOURS_TRAVAIL`)
- **Horaires** : L'heure de début et de fin doivent être dans les horaires de travail
- **Quota mensuel** : La somme de toutes les autorisations (en attente + approuvées) du mois ne peut pas dépasser le quota

#### Interface
- Formulaire : date, heure début, heure fin
- Affichage des horaires de travail de l'entreprise
- Warnings en temps réel (jour non ouvré, hors horaires, dépassement quota)

---

### 5.5 Gestion du Télétravail

#### Description
Demandes de télétravail avec dates début/fin.

#### Fonctionnalités
- Sélection période (date début + date fin)
- Validation : date fin ≥ date début
- Suivi du statut (EN_ATTENTE → APPROUVEE/REFUSEE)

---

### 5.6 Calendrier & Horaires

#### Description
Gestion du calendrier d'entreprise (jours fériés, spéciaux) et des horaires de travail avec télétravail.

#### 5.6.1 Calendrier Admin (CalendrierPage)
**Page d'administration** avec 2 onglets :

**Onglet "Jours fériés / spéciaux"** :
| Fonctionnalité | Détail |
|----------------|--------|
| Création unitaire | Date, nom, type, origine, payé, description |
| Création par lot | Plage de dates → une entrée par jour |
| Types disponibles | Ouvrable, Férié, Congé payé, Congé non payé, Télétravail |
| Origine | National / International |
| Recherche & filtrage | Par nom et par type |

**Onglet "Horaires de travail"** :
| Fonctionnalité | Détail |
|----------------|--------|
| Nom de l'horaire | Ex: "Horaire standard", "Horaire été" |
| Heures de travail | Début / Fin |
| Pause déjeuner | Début / Fin (optionnel) |
| Jours de travail | Sélection par boutons bascule (Lu–Di) |
| Jours de télétravail | Sélection séparée (boutons bleus) |
| Période de validité | Date début / Date fin (optionnel) |

#### 5.6.2 Mon Calendrier (MonCalendrierPage)
**Page personnelle** affichant :

- **Grille calendrier mensuelle** avec couleurs :
  - 🔴 Jours fériés
  - 🟠 Congés (approuvés) / ⏳ Congés (en attente)
  - 🔵 Télétravail / ⏳ Télétravail (en attente)
  - 🟣 Autorisations / ⏳ Autorisations (en attente)
  - ⬜ Jours de repos (non travaillés selon l'horaire)
  - 🏠 Jours de télétravail entreprise

- **4 cartes statistiques** : Jours fériés, Congés, Télétravail, Autorisations (année en cours)
- **Légende** avec 7 types d'événements
- **Navigation** mois par mois + bouton "Aujourd'hui"
- **Intégration horaires** : Les jours non travaillés et jours de TT entreprise sont calculés depuis l'horaire actif

---

### 5.7 Pointage

#### Description
Suivi quotidien du temps de travail des employés.

#### Fonctionnalités
- **Pointer l'entrée** : Enregistre l'heure d'arrivée
  - Si > 15 minutes après le début de l'horaire → statut **RETARD**
  - Sinon → statut **PRÉSENT**
- **Pointer la sortie** : Enregistre l'heure de départ
  - Si > 30 minutes avant la fin de l'horaire → statut **INCOMPLET**
- **Historique** : Tableau avec date, heures, statut, source

#### Statuts de pointage
| Statut | Couleur | Description |
|--------|---------|-------------|
| PRESENT | 🟢 Vert | Présent dans les horaires |
| RETARD | 🟡 Jaune | Arrivée > 15 min après l'heure |
| INCOMPLET | 🟠 Orange | Départ > 30 min avant la fin |
| ABSENT | 🔴 Rouge | Aucun pointage enregistré |

---

### 5.8 Projets & Tâches

#### 5.8.1 Projets

Gestion complète du cycle de vie des projets.

| Statut | Description | Transitions possibles |
|--------|-------------|-----------------------|
| PLANIFIÉ | Projet créé, non démarré | → EN_COURS |
| EN_COURS | Projet actif | → CLOTURÉ, ANNULÉ |
| CLOTURÉ | Projet terminé | — |
| ANNULÉ | Projet abandonné | — |

**Fonctionnalités** : Nom, dates début/fin, changement de statut, suppression

#### 5.8.2 Tâches

Vue **Kanban** en 3 colonnes :

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    À FAIRE    │  │   EN COURS    │  │    TERMINÉ    │
│   (TODO)      │  │ (IN_PROGRESS) │  │    (DONE)     │
│               │  │               │  │               │
│  ┌─────────┐  │  │  ┌─────────┐  │  │  ┌─────────┐  │
│  │ Tâche 1 │──────▶│ Tâche 1 │──────▶│ Tâche 1 │  │
│  └─────────┘  │  │  └─────────┘  │  │  └─────────┘  │
│  ┌─────────┐  │  │               │  │               │
│  │ Tâche 2 │  │  │               │  │               │
│  └─────────┘  │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

**Chaque carte** : Titre, projet, date d'échéance, assigné à, bouton d'avancement

---

### 5.9 Équipes

#### Description
Gestion des équipes liées aux projets.

#### Fonctionnalités
- **Affichage en grille** de cartes (responsive 1/2/3 colonnes)
- **Chaque équipe** : nom, projet associé, liste des membres avec avatars
- **Ajouter/Retirer des membres** : Via dropdown d'employés
- **Créer/Supprimer des équipes** : Liées à un projet existant

---

### 5.10 Validation Multi-Niveaux

#### Description
Workflow de validation des demandes avec validateurs ordonnés.

#### Mécanisme
```
Demande EN_ATTENTE
    │
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Validateur 1 │───▶│ Validateur 2 │───▶│ Validateur N │
│  (ordre: 1)  │    │  (ordre: 2)  │    │  (ordre: N)  │
│              │    │              │    │              │
│ APPROUVÉE ✓  │    │ APPROUVÉE ✓  │    │ APPROUVÉE ✓  │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                                    Tous approuvés ?
                                       │        │
                                      Oui      Non (1 refus)
                                       ▼        ▼
                                  APPROUVÉE   REFUSÉE
```

**Règles** :
- ✅ **Tous les validateurs** doivent approuver pour que la demande passe
- ❌ **Un seul refus** suffit à rejeter la demande entière
- Chaque étape a un commentaire optionnel

---

### 5.11 Notifications

#### Description
Système de notifications in-app lié aux décisions sur les demandes.

#### Déclencheurs
| Événement | Notification envoyée |
|-----------|---------------------|
| Demande approuvée | "Votre demande de {type} a été approuvée par {admin}" |
| Demande refusée | "Votre demande de {type} a été refusée par {admin}" + motif |

#### Fonctionnalités backend
- Création automatique lors de l'approbation/refus
- Compteur de notifications non lues
- Marquer comme lu (unitaire ou en masse)
- Tri par date de création décroissante

---

### 5.12 Référentiels

#### Description
Configuration centralisée de toutes les données de référence et paramètres du système.

#### Types de référentiels

| Type | Description | Exemple |
|------|-------------|---------|
| **DEPARTEMENT** | Départements de l'entreprise | Marketing, IT, Finance |
| **TYPE_CONTRAT** | Types de contrats | CDI, CDD, Stage |
| **SITE_ETABLISSEMENT** | Sites physiques | Siège Tunis, Antenne Sfax |
| **POSTE** | Postes de travail | Développeur, Designer, Chef de projet |
| **NIVEAU_HIERARCHIQUE** | Niveaux hiérarchiques | Junior, Senior, Lead |
| **TYPE_CONGE** | Types de congé | Auto-initialisés au démarrage |
| **TYPE_DEMANDE** | Types de demandes | Congé, Autorisation, Télétravail |
| **GENRE** | Genres | Homme, Femme |
| **PARAMETRE_SYSTEME** | Paramètres configurables | Solde, taux, horaires, quotas |

#### Interface
- **Sidebar gauche** : Liste des types avec compteur d'éléments
- **Zone principale** : Tableau CRUD avec recherche
- **Colonne "Valeur"** : Affichée uniquement pour PARAMETRE_SYSTEME (avec inférence d'unité : jours, minutes, heures)
- **Statut Actif/Inactif** : Toggle cliquable

---

### 5.13 Tableau de Bord

#### Description
Vue d'ensemble de l'état RH avec statistiques et graphiques.

#### Contenu (actuellement statique)
- **Bannière de bienvenue** personnalisée avec le prénom
- **4 cartes statistiques** : Total employés, Demandes en attente, Présents aujourd'hui, Projets actifs
- **Graphique en barres** : Demandes par mois vs validées
- **Graphique circulaire** : Répartition par type de demande
- **Activité récente** : Liste des dernières actions

---

## 6. Règles Métier Détaillées

### 6.1 Calcul du Solde Congé (Ancienneté)

Le solde congé est calculé automatiquement basé sur la date d'embauche :

| Ancienneté | Droit annuel | Taux mensuel |
|------------|-------------|--------------|
| 1ère année | 18 jours | 1.5 j/mois |
| 2ème année+ | 24 jours | 2.0 j/mois |

**Détail du calcul** :
```
1. Année de congé = dateEmbauche anniversaire → prochain anniversaire
2. Mois travaillés = mois pleins dans l'année de congé en cours
   (mois partiel ≥ 15 jours = 1 mois complet)
3. Jours acquis = min(moisTravaillés × tauxMensuel, droitAnnuel)
4. Report = min(soldeAnnéePrécédente, MAX_REPORT_CONGE=5)
5. Jours consommés = somme joursOuvrables des congés payés APPROUVÉS
6. Solde disponible = max(0, acquis + report - consommés)
7. Solde prévisionnel = max(0, acquis + report - consommés - enAttente)
```

### 6.2 Calcul Intelligent des Jours (Smart Day Counting)

```
Exemple : Congé du 3 au 7 (lundi au vendredi)
         Lundi 8 = férié

 Lu 3  Ma 4  Me 5  Je 6  Ve 7 | Sa 8  Di 9 | Lu 10 (férié)  Ma 11
 [=====période demandée======]  [week-end]  [férié]

 joursOuvrables = 5 (Lu-Ve, sans compter férié/WE)
 Extension avant : aucune
 Extension après : Sa 8 + Di 9 + Lu 10 (férié) = +3 jours
 nombreJours = 8 (du 3 au 10 inclus)
 
 → Déduction du solde : 5 jours (joursOuvrables)
 → Mais l'employé est en congé effectif : 8 jours (nombreJours)
```

**Extension arrière (Pont)** :
Si les jours immédiatement avant la date de début sont des jours fériés consécutifs, ils sont inclus dans le congé.

**Extension avant** :
Après la date de fin, les jours non travaillés consécutifs (week-ends + fériés) sont automatiquement ajoutés.

### 6.3 Règle des 4× (Délai d'anticipation)

```
La demande doit être soumise au moins (nombreJours × 4) jours calendaires 
avant la dateDebut.

Exemple : Congé de 5 jours → doit être demandé au moins 20 jours à l'avance.

Types exemptés : CONGE_MALADIE, CONGE_DECES_PROCHE, CONGE_DECES_FAMILLE, 
                 CONGE_EXCEPTIONNEL
```

### 6.4 Règle du Vendredi Seul

```
Si tous les jours ouvrés dans la période demandée sont des vendredis :
→ Le type doit être CONGE_SANS_SOLDE (pas de congé payé)
```

### 6.5 Contrôle d'Autorisation

```
1. Durée max par autorisation = MAX_AUTORISATION_MINUTES (120 min)
2. Date = jour ouvré (LUNDI–VENDREDI par défaut)
3. Heures = dans les horaires de travail (08:00–18:00)
4. Quota mensuel : Σ(durées EN_ATTENTE + APPROUVÉES ce mois) + nouvelle ≤ max
```

### 6.6 Approbation / Refus

```
Approbation :
1. Statut : EN_ATTENTE → APPROUVEE
2. Si CONGE_PAYE : soldeConge -= joursOuvrables
3. Historique : enregistrement du changement de statut
4. Notification : "Votre demande a été approuvée par {admin}"

Refus :
1. Statut : EN_ATTENTE → REFUSEE
2. MotifRefus = commentaire du refus
3. Historique : enregistrement avec commentaire
4. Notification : "Votre demande a été refusée par {admin}" + motif

Annulation (par l'employé) :
1. Statut : EN_ATTENTE → ANNULEE
2. Historique enregistré
```

---

## 7. API REST — Catalogue des Endpoints

**Base URL** : `http://localhost:8080/api`  
**Format** : JSON (sauf upload multipart)  
**Réponse standard** : `ApiResponse<T>` → `{ message, data, success }`

### 7.1 Authentification (`/api/auth`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | Connexion (username + password) |
| POST | `/auth/register` | Création de compte (employeId, username, password, role) |

### 7.2 Employés (`/api/employes`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/employes` | Liste tous les employés |
| GET | `/employes/{id}` | Employé par ID |
| GET | `/employes/matricule/{matricule}` | Employé par matricule |
| GET | `/employes/{id}/subordinates` | Subordonnés d'un manager |
| POST | `/employes` | Créer un employé |
| PUT | `/employes/{id}` | Modifier un employé |
| DELETE | `/employes/{id}` | Supprimer un employé |
| PATCH | `/employes/{id}/solde-conge` | Modifier le solde manuellement |
| GET | `/employes/{id}/solde-info` | Informations détaillées du solde |
| GET | `/employes/horaire-entreprise` | Horaires et paramètres entreprise |

### 7.3 Demandes (`/api/demandes`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/demandes` | Toutes les demandes |
| GET | `/demandes/{id}` | Demande par ID |
| GET | `/demandes/employe/{employeId}` | Demandes d'un employé |
| GET | `/demandes/statut/{statut}` | Demandes par statut |
| POST | `/demandes` | Créer une demande (JSON) |
| POST | `/demandes/with-file` | Créer avec justificatif (multipart) |
| GET | `/demandes/fichier/{filename}` | Télécharger un justificatif |
| PATCH | `/demandes/{id}/approve` | Approuver |
| PATCH | `/demandes/{id}/refuse` | Refuser (+ commentaire) |
| PATCH | `/demandes/{id}/cancel` | Annuler |
| PATCH | `/demandes/batch/approve` | Approbation en masse |
| PATCH | `/demandes/batch/refuse` | Refus en masse |
| GET | `/demandes/{id}/historique` | Historique des statuts |
| GET | `/demandes/calculate-days` | Calcul jours effectifs |

### 7.4 Calendrier & Horaires (`/api/calendrier`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/calendrier/jours` | Tous les jours |
| GET | `/calendrier/jours/{id}` | Jour par ID |
| GET | `/calendrier/jours/type/{typeJour}` | Jours par type |
| GET | `/calendrier/jours/periode` | Jours par période |
| GET | `/calendrier/jours/feries/{annee}` | Jours fériés par année |
| POST | `/calendrier/jours` | Créer un jour |
| PUT | `/calendrier/jours/{id}` | Modifier un jour |
| DELETE | `/calendrier/jours/{id}` | Supprimer un jour |
| GET | `/calendrier/horaires` | Tous les horaires |
| GET | `/calendrier/horaires/{id}` | Horaire par ID |
| POST | `/calendrier/horaires` | Créer un horaire |
| PUT | `/calendrier/horaires/{id}` | Modifier un horaire |
| DELETE | `/calendrier/horaires/{id}` | Supprimer un horaire |

### 7.5 Pointage (`/api/pointages`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/pointages` | Tous les pointages |
| GET | `/pointages/{id}` | Pointage par ID |
| GET | `/pointages/employe/{employeId}` | Pointages par employé |
| GET | `/pointages/employe/{employeId}/range` | Pointages par période |
| GET | `/pointages/date/{date}` | Pointages par date |
| POST | `/pointages/clock-in/{employeId}` | Pointer l'entrée |
| POST | `/pointages/clock-out/{employeId}` | Pointer la sortie |
| DELETE | `/pointages/{id}` | Supprimer un pointage |

### 7.6 Projets (`/api/projets`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/projets` | Tous les projets |
| GET | `/projets/{id}` | Projet par ID |
| GET | `/projets/statut/{statut}` | Projets par statut |
| POST | `/projets` | Créer un projet |
| PUT | `/projets/{id}` | Modifier un projet |
| PATCH | `/projets/{id}/statut` | Changer le statut |
| DELETE | `/projets/{id}` | Supprimer un projet |

### 7.7 Tâches (`/api/taches`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/taches` | Toutes les tâches |
| GET | `/taches/{id}` | Tâche par ID |
| GET | `/taches/projet/{projetId}` | Tâches par projet |
| GET | `/taches/assignee/{employeId}` | Tâches par assigné |
| POST | `/taches/projet/{projetId}` | Créer une tâche |
| PUT | `/taches/{id}` | Modifier une tâche |
| PATCH | `/taches/{id}/assign/{employeId}` | Assigner à un employé |
| PATCH | `/taches/{id}/statut` | Changer le statut |
| DELETE | `/taches/{id}` | Supprimer |

### 7.8 Équipes (`/api/equipes`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/equipes` | Toutes les équipes |
| GET | `/equipes/{id}` | Équipe par ID |
| GET | `/equipes/projet/{projetId}` | Équipes par projet |
| POST | `/equipes` | Créer une équipe |
| POST | `/equipes/{id}/membres/{employeId}` | Ajouter un membre |
| DELETE | `/equipes/{id}/membres/{employeId}` | Retirer un membre |
| DELETE | `/equipes/{id}` | Supprimer l'équipe |

### 7.9 Validations (`/api/validations`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/validations/demande/{demandeId}` | Étapes d'une demande |
| GET | `/validations/validateur/{validateurId}` | Validations d'un validateur |
| GET | `/validations/validateur/{validateurId}/pending` | Validations en attente |
| POST | `/validations` | Créer une étape de validation |
| PATCH | `/validations/{id}/approve` | Approuver une étape |
| PATCH | `/validations/{id}/refuse` | Refuser une étape |

### 7.10 Notifications (`/api/notifications`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/notifications/employe/{employeId}` | Toutes les notifications |
| GET | `/notifications/employe/{employeId}/unread` | Non lues |
| GET | `/notifications/employe/{employeId}/unread-count` | Compteur non lues |
| PATCH | `/notifications/{id}/read` | Marquer comme lue |
| PATCH | `/notifications/employe/{employeId}/read-all` | Tout marquer comme lu |

### 7.11 Référentiels (`/api/referentiels`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/referentiels/types` | Tous les types d'enum |
| GET | `/referentiels` | Tous les référentiels |
| GET | `/referentiels/{id}` | Par ID |
| GET | `/referentiels/type/{type}` | Par type |
| GET | `/referentiels/type/{type}/actifs` | Actifs par type |
| POST | `/referentiels` | Créer |
| PUT | `/referentiels/{id}` | Modifier |
| PATCH | `/referentiels/{id}/toggle-actif` | Basculer actif/inactif |
| DELETE | `/referentiels/{id}` | Supprimer |

**Total : 68 endpoints REST**

---

## 8. Interface Utilisateur — Pages

### Navigation (Sidebar)

```
📋 MENU
├── 🏠 Tableau de bord          → /dashboard
├── 👥 Employés                  → /employes
├── 📄 Mes demandes              → /mes-demandes
└── 📅 Mon calendrier            → /mon-calendrier

⚙️ GESTION
├── ✅ Validation demandes
│   └── 📋 Demandes congés       → /demandes
└── ⏱️ Pointage                  → /pointage

📂 PROJETS
├── 📁 Projets
│   ├── 📋 Tous les projets      → /projets
│   └── ✓ Tâches                 → /taches
└── 👥 Équipes                   → /equipes

🔧 ADMINISTRATION
├── 📊 Référentiels              → /referentiels
└── 📅 Calendrier                → /calendrier
```

### Pages détaillées

| # | Page | Route | Rôle | Description |
|---|------|-------|------|-------------|
| 1 | **Connexion** | `/login` | Public | Formulaire login avec branding Antigone |
| 2 | **Tableau de bord** | `/dashboard` | Tous | Statistiques, graphiques, activité récente |
| 3 | **Employés** | `/employes` | Tous | CRUD employés, recherche, solde congé |
| 4 | **Demandes (Admin)** | `/demandes` | Admin | Gestion des demandes, stats, calendrier équipe, batch |
| 5 | **Mes demandes** | `/mes-demandes` | Tous | Mes demandes personnelles, solde info, annulation |
| 6 | **Nouvelle demande** | `/demandes/new` | Tous | Formulaire multi-type (congé/autorisation/TT) |
| 7 | **Calendrier (Admin)** | `/calendrier` | Admin | Jours fériés + Horaires de travail |
| 8 | **Mon calendrier** | `/mon-calendrier` | Tous | Calendrier personnel avec événements colorés |
| 9 | **Pointage** | `/pointage` | Tous | Pointer entrée/sortie, historique |
| 10 | **Projets** | `/projets` | Tous | CRUD projets, cycle de vie |
| 11 | **Tâches** | `/taches` | Tous | Vue Kanban (TODO/IN_PROGRESS/DONE) |
| 12 | **Équipes** | `/equipes` | Tous | Gestion équipes, membres |
| 13 | **Référentiels** | `/referentiels` | Admin | Configuration système, 9 types |
| 14 | **Validations** | `/validations` | Validateurs | Workflow de validation |

---

## 9. Sécurité & Rôles

### Rôles du système

| Rôle | Description | Fonctionnalités spécifiques |
|------|-------------|---------------------------|
| **SUPER_ADMIN** | Administrateur système | Vue de toutes les demandes, approbation/refus, stats, calendrier équipe, actions en masse, gestion calendrier/référentiels |
| **EMPLOYE** | Employé standard | Mes demandes, nouvelle demande, annulation, pointage, mon calendrier |

### Modèle de permissions
```
Compte ←→ Role ←→ Permission
  1:N       N:M       N:M
```

- Un compte peut avoir plusieurs rôles
- Chaque rôle peut avoir plusieurs permissions
- Les permissions sont fines (extensibles)

### Sécurité technique
- **Hachage** : BCrypt pour les mots de passe
- **CORS** : Autorisé pour `localhost:3000` et `localhost:5173`
- **Sessions** : Stateless (pas de session serveur)
- **Uploads** : Max 10 MB, stockage local dans `uploads/justificatifs`
- **Intercepteur 401** : Déconnexion automatique côté frontend si non authentifié

---

## 10. Structure du Projet

### Backend
```
Backend/
├── pom.xml
├── mvnw / mvnw.cmd
└── src/main/java/com/antigone/rh/
    ├── RhApplication.java              # Point d'entrée
    ├── config/
    │   ├── DataInitializer.java        # Seed données initiales
    │   ├── SecurityConfig.java         # Config Spring Security
    │   └── WebConfig.java              # Config CORS
    ├── controller/                     # 11 contrôleurs REST
    │   ├── AuthController.java
    │   ├── CalendrierController.java
    │   ├── DemandeController.java
    │   ├── EmployeController.java
    │   ├── EquipeController.java
    │   ├── NotificationController.java
    │   ├── PointageController.java
    │   ├── ProjetController.java
    │   ├── ReferentielController.java
    │   ├── TacheController.java
    │   └── ValidationController.java
    ├── dto/                            # 16 DTOs
    │   ├── ApiResponse.java
    │   ├── LoginRequest/Response.java
    │   ├── DemandeRequest/Response.java
    │   ├── EmployeDTO.java
    │   ├── SoldeCongeInfo.java
    │   └── ...
    ├── entity/                         # 20 entités JPA
    │   ├── Employe.java
    │   ├── Compte.java
    │   ├── Demande.java (héritage JOINED)
    │   ├── Conge.java
    │   ├── Autorisation.java
    │   ├── Teletravail.java
    │   ├── Calendrier.java
    │   ├── HoraireTravail.java
    │   └── ...
    ├── enums/                          # 12 énumérations
    │   ├── TypeConge.java (12 types)
    │   ├── StatutDemande.java
    │   ├── TypeJour.java
    │   └── ...
    ├── repository/                     # 20 repositories JPA
    ├── service/                        # 12 services métier
    │   ├── DemandeService.java (678 lignes, logique principale)
    │   ├── EmployeService.java (calcul solde)
    │   ├── CalendrierService.java
    │   └── ...
    └── exception/
```

### Frontend
```
Frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx                        # Point d'entrée React
    ├── App.tsx                         # Router + Routes
    ├── index.css                       # Tailwind CSS
    ├── api/                            # 11 services API (Axios)
    │   ├── authService.ts
    │   ├── employeService.ts
    │   ├── demandeService.ts
    │   ├── calendrierService.ts
    │   └── ...
    ├── components/
    │   └── layout/
    │       ├── MainLayout.tsx
    │       ├── Sidebar.tsx
    │       └── Navbar.tsx
    ├── context/
    │   └── AuthContext.tsx
    ├── hooks/
    │   └── useAuth.ts
    ├── types/
    │   └── index.ts                    # Interfaces + Enums TypeScript
    └── pages/                          # 14 pages
        ├── LoginPage.tsx
        ├── DashboardPage.tsx
        ├── EmployesPage.tsx
        ├── DemandesPage.tsx
        ├── MesDemandesPage.tsx
        ├── NewDemandePage.tsx
        ├── CalendrierPage.tsx
        ├── MonCalendrierPage.tsx
        ├── PointagePage.tsx
        ├── ProjetsPage.tsx
        ├── TachesPage.tsx
        ├── EquipesPage.tsx
        ├── ReferentielsPage.tsx
        └── ValidationsPage.tsx
```

---

## Annexe : Schéma Relationnel de la Base de Données

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  permissions │◄────│role_permissions│────►│    roles     │
│──────────────│     └──────────────┘     │──────────────│
│ id           │                          │ id           │
│ permission   │     ┌──────────────┐     │ nom          │
└──────────────┘     │ compte_roles │────►└──────┬───────┘
                     └──────┬───────┘            │
                            │              ┌─────┘
                     ┌──────▼───────┐      │
                     │   comptes    │◄─────┘
                     │──────────────│
                     │ id           │
                     │ username     │
                     │ passwordHash │     ┌──────────────┐
                     │ enabled      │     │  employes    │
                     │ employe_id ──┼────►│──────────────│
                     └──────────────┘     │ id           │
                                          │ matricule    │
          ┌───────────────────────────────│ nom, prenom  │
          │              ┌────────────────│ email        │
          │              │                │ soldeConge   │
          │              │                │ sexe         │
          ▼              ▼                │ manager_id──►│ (self-ref)
   ┌──────────────┐ ┌──────────┐         └──────────────┘
   │  pointages   │ │ demandes │              │    │
   │──────────────│ │──────────│              │    │
   │ dateJour     │ │ type     │    ┌─────────┘    │
   │ heureEntree  │ │ statut   │    │         ┌────┘
   │ heureSortie  │ │ raison   │    │         │
   │ statut       │ │ employe_id│    │         ▼
   │ employe_id   │ └────┬─────┘    │  ┌──────────────────┐
   └──────────────┘      │          │  │equipe_employes   │
                         │          │  └──────────────────┘
          ┌──────────────┼──────────┼───────┐    │
          │              │          │       │    │
          ▼              ▼          ▼       │    ▼
   ┌──────────┐   ┌───────────┐ ┌──────┐   │ ┌────────┐
   │  conges  │   │autorisations│ │tele- │   │ │equipes │
   │──────────│   │───────────│ │travail│   │ │────────│
   │ typeConge│   │ date      │ │──────│   │ │ nom    │
   │ dateDebut│   │ heureDebut│ │dateDeb│   │ │projet_id│
   │ dateFin  │   │ heureFin  │ │dateFin│   │ └────────┘
   │ nbrJours │   └───────────┘ └──────┘   │
   │ justific.│                             │
   └──────────┘                             │
                                            │
   ┌──────────────┐   ┌──────────────┐      │
   │ validations  │   │historique_   │      │
   │──────────────│   │statuts       │      │
   │ ordre        │   │──────────────│      │
   │ decision     │   │ ancienStatut │      │
   │ demande_id   │   │ nouveauStatut│      │
   │ validateur_id│   │ demande_id   │      │
   └──────────────┘   │ modifiePar_id│      │
                      └──────────────┘      │
                                            ▼
   ┌──────────────┐                  ┌──────────────┐
   │notifications │                  │   projets    │
   │──────────────│                  │──────────────│
   │ titre        │                  │ nom          │
   │ message      │                  │ statut       │
   │ lu           │                  │ dateDebut    │
   │ employe_id   │                  │ dateFin      │
   │ demande_id   │                  └──────┬───────┘
   └──────────────┘                         │
                                            ▼
   ┌──────────────┐                  ┌──────────────┐
   │referentiels  │                  │   taches     │
   │──────────────│                  │──────────────│
   │ libelle      │                  │ titre        │
   │ description  │                  │ statut       │
   │ actif        │                  │ dateEcheance │
   │ valeur       │                  │ projet_id    │
   │ typeReferentiel│                │ assignee_id  │
   └──────────────┘                  └──────────────┘

   ┌──────────────┐   ┌──────────────────┐
   │ calendrier   │   │ horaires_travail │
   │──────────────│   │──────────────────│
   │ dateJour     │   │ nom              │
   │ nomJour      │   │ heureDebut       │
   │ typeJour     │   │ heureFin         │
   │ origine      │   │ pauseDebutMidi   │
   │ estPaye      │   │ pauseFinMidi     │
   └──────────────┘   │ joursTravail     │
                      │ joursTeletravail │
   ┌──────────────┐   │ dateDebut        │
   │ affectations_│   │ dateFin          │
   │ horaire      │   └──────────────────┘
   │──────────────│
   │ dateDebut    │   ┌──────────────────┐
   │ dateFin      │   │ periodes_bloquees│
   │ employe_id   │   │──────────────────│
   │ horaire_id   │   │ dateDebut        │
   └──────────────┘   │ dateFin          │
                      │ nbMinEmployes    │
                      │ raison           │
                      │ cree_par_id      │
                      └──────────────────┘
```

**Total : 20 tables, 12 enums, 68 endpoints REST, 14 pages frontend**

---

*Documentation générée le 28 février 2026 — Antigone RH v1.0.0*
