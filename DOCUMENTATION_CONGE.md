# Documentation des Formules de Congé — Application RH Antigone

> **Date de rédaction :** 08/03/2026  
> Cette documentation décrit l'ensemble des règles métier, formules et validations appliquées dans le module de gestion des congés.

---

## Table des matières

1. [Paramètres système configurables](#1-paramètres-système-configurables)
2. [Types de congé](#2-types-de-congé)
3. [Calcul du solde congé](#3-calcul-du-solde-congé)
4. [Calcul des jours effectifs (nombreJours)](#4-calcul-des-jours-effectifs-nombrejours)
5. [Règles de validation à la création](#5-règles-de-validation-à-la-création)
6. [Cycle de vie d'une demande](#6-cycle-de-vie-dune-demande)
7. [Exemples pratiques](#7-exemples-pratiques)

---

## 1. Paramètres système configurables

Ces valeurs sont stockées dans la table `referentiels` avec le type `PARAMETRE_SYSTEME` et sont modifiables depuis l'interface **Référentiels → Paramètre système** sans toucher au code.

| Paramètre | Valeur par défaut | Description |
|---|---|---|
| `SOLDE_CONGE_AN1` | **18 jours** | Droit annuel de congé pour la **1ère année** d'ancienneté (1.5 j/mois × 12) |
| `SOLDE_CONGE_AN2_PLUS` | **24 jours** | Droit annuel de congé **à partir de la 2ème année** (2 j/mois × 12) |
| `TAUX_MENSUEL_AN1` | **1.5** | Taux d'acquisition mensuel en 1ère année |
| `TAUX_MENSUEL_AN2_PLUS` | **2.0** | Taux d'acquisition mensuel à partir de la 2ème année |
| `MAX_REPORT_CONGE` | **5 jours** | Maximum de jours reportables d'une année de congé sur la suivante |
| `MAX_AUTORISATION_MINUTES` | **120 min** | Maximum de minutes d'autorisation de sortie par mois par employé (2h) |

> **⚠️ Les valeurs par défaut ne sont utilisées qu'en cas d'absence de la ligne correspondante en base.** Si vous modifiez la valeur dans l'interface, c'est la nouvelle valeur qui sera appliquée immédiatement.

---

## 2. Types de congé

| Type | Libellé | Durée max | Justificatif obligatoire | Restriction genre |
|---|---|---|---|---|
| `CONGE_PAYE` | Congé payé | Selon solde disponible | Non | — |
| `CONGE_MALADIE` | Congé maladie | 2 jours ouvrables max | Oui (certificat médical) | — |
| `CONGE_MATERNITE` | Congé maternité | 90 jours calendaires (60j + 30j prolongation) | Oui (certificat médical / attestation d'accouchement) | **Femme uniquement** |
| `CONGE_PATERNITE` | Congé paternité | — | Non | — |
| `CONGE_SANS_SOLDE` | Congé sans solde | — | Non | — |
| `CONGE_EXCEPTIONNEL` | Congé exceptionnel | — | Non | — |
| `CONGE_FORMATION` | Congé formation | — | Non | — |
| `CONGE_RECUPERATION` | Congé récupération | — | Non | — |
| `CONGE_ADMINISTRATIF` | Congé administratif | — | Non | — |
| `CONGE_REGLES` | Congé règles | 1 jour ouvrable max | Non | **Femme uniquement** |
| `CONGE_DECES_PROCHE` | Congé décès (proche) | **5 jours fixe** | Oui (attestation de décès) | — |
| `CONGE_DECES_FAMILLE` | Congé décès (famille) | **1 jour fixe** | Oui (attestation de décès) | — |

> Chaque type peut être **activé/désactivé** dans l'interface Référentiels → Type congé. Un type désactivé ne peut pas être sélectionné pour une nouvelle demande.

---

## 3. Calcul du solde congé

### 3.1. Année de congé (basée sur la date d'embauche)

L'année de congé n'est **pas** l'année civile (janvier-décembre). Elle est basée sur **l'anniversaire de la date d'embauche** de l'employé.

$$\text{Début année congé} = \text{dateEmbauche} + N \text{ ans}$$
$$\text{Fin année congé} = \text{Début} + 1 \text{ an} - 1 \text{ jour}$$

Où $N$ = nombre d'années complètes d'ancienneté.

**Exemple :** Embauché le 15/06/2025 → Année congé 1 : 15/06/2025 au 14/06/2026, Année congé 2 : 15/06/2026 au 14/06/2027, etc.

### 3.2. Ancienneté

$$\text{ancienneteAnnees} = \text{Period.between(dateEmbauche, aujourd'hui).getYears()}$$
$$\text{ancienneteMois} = \text{ancienneteAnnees} \times 12 + \text{moisRestants}$$

### 3.3. Sélection du taux selon l'ancienneté

| Ancienneté | Droit annuel | Taux mensuel |
|---|---|---|
| < 1 an | `SOLDE_CONGE_AN1` (18j) | `TAUX_MENSUEL_AN1` (1.5) |
| ≥ 1 an | `SOLDE_CONGE_AN2_PLUS` (24j) | `TAUX_MENSUEL_AN2_PLUS` (2.0) |

### 3.4. Mois travaillés dans l'année en cours

$$\text{moisTravaillés} = \text{mois complets depuis le début de l'année de congé}$$

> **Règle du mois partiel :** Si le nombre de jours entamés dans le mois en cours est **≥ 15 jours**, ce mois est compté comme un mois complet.

$$\text{Si } \text{joursRestants} \geq 15 \Rightarrow \text{moisTravaillés} + 1$$

Plafonné à **12 mois** maximum.

### 3.5. Déduction pour congé sans solde

Si un employé a un **congé sans solde approuvé** qui couvre **tous les jours ouvrables** d'un mois donné, ce mois n'est **pas compté** pour l'acquisition de congé.

$$\text{moisTravaillés} = \text{moisTravaillés} - \text{moisNonTravaillés (couverts par congé sans solde)}$$

### 3.6. Jours acquis

$$\text{joursAcquis} = \min(\text{moisTravaillés} \times \text{tauxMensuel}, \text{droitAnnuel})$$

**Exemple 1ère année, 6 mois travaillés :**
$$\text{joursAcquis} = \min(6 \times 1.5, 18) = \min(9, 18) = 9 \text{ jours}$$

**Exemple 2ème année, 12 mois :**
$$\text{joursAcquis} = \min(12 \times 2, 24) = \min(24, 24) = 24 \text{ jours}$$

### 3.7. Report de l'année précédente

Si l'employé a ≥ 1 an d'ancienneté, un report est calculé :

$$\text{reliquat} = \max(0, \text{acquis année précédente} - \text{consommés année précédente})$$
$$\text{joursReportés} = \min(\text{reliquat}, \text{MAX\_REPORT\_CONGE})$$

Le report est **ajouté** aux jours acquis :

$$\text{joursAcquis} = \text{joursAcquis} + \text{joursReportés}$$

> **`MAX_REPORT_CONGE` = 5 jours** par défaut. Si l'employé avait un reliquat de 8 jours, seuls 5 seront reportés.

### 3.8. Jours consommés et en attente

Les jours consommés et en attente sont calculés en utilisant le champ `nombreJours` (jours effectifs, incluant weekends et jours fériés en extension) et **non** `joursOuvrables`.

$$\text{joursConsommés} = \sum_{\text{congés payés APPROUVÉS dans l'année}} \text{nombreJours}$$

$$\text{joursEnAttente} = \sum_{\text{congés payés EN\_ATTENTE dans l'année}} \text{nombreJours}$$

> **⚠️ Règle entreprise :** C'est le `nombreJours` (jours effectifs incluant les extensions weekends/fériés) qui est déduit du solde, pas les `joursOuvrables` seuls. Voir la section 4 pour le détail du calcul de `nombreJours`.

### 3.9. Solde final

**Calcul automatique** (cas standard) :

$$\boxed{\text{soldeDisponible} = \max(0, \text{joursAcquis} - \text{joursConsommés})}$$

$$\boxed{\text{soldePrévisionnel} = \max(0, \text{joursAcquis} - \text{joursConsommés} - \text{joursEnAttente})}$$

**Gestion manuelle** (si `soldeCongeInitial` est défini sur l'employé) :

$$\text{soldeDisponible} = \text{employe.soldeConge (valeur stockée)}$$
$$\text{soldePrévisionnel} = \max(0, \text{soldeDisponible} - \text{joursEnAttente})$$

### 3.10. Résumé du flux complet

```
                  ┌──────────────────────────────────┐
                  │    Date d'embauche de l'employé   │
                  └──────────────┬───────────────────┘
                                 │
                  ┌──────────────▼───────────────────┐
                  │ Calcul ancienneté (années, mois)  │
                  └──────────────┬───────────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │ Sélection taux : AN1 ou AN2_PLUS    │
              │ droitAnnuel = 18j ou 24j            │
              │ tauxMensuel = 1.5 ou 2.0            │
              └──────────────────┬──────────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │ Mois travaillés dans l'année congé  │
              │ - Règle du mois partiel (≥15j)      │
              │ - Déduction congé sans solde         │
              └──────────────────┬──────────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │ joursAcquis = min(mois × taux, droit)│
              │ + joursReportés (max 5j)             │
              └──────────────────┬──────────────────┘
                                 │
      ┌──────────────────────────▼──────────────────────────┐
      │ soldeDisponible = max(0, acquis - consommés)        │
      │ soldePrévisionnel = max(0, acquis - consommés - attente) │
      └─────────────────────────────────────────────────────┘
```

---

## 4. Calcul des jours effectifs (nombreJours)

### 4.1. Différence entre `joursOuvrables` et `nombreJours`

| Champ | Signification | Utilisé pour |
|---|---|---|
| `joursOuvrables` | Jours de travail effectifs uniquement (hors weekends et fériés) + fériés sandwichés | Affichage d'information, validation maladie/règles |
| `nombreJours` | Durée totale incluant les extensions (weekends et fériés avant/après) | **Déduction du solde congé** |

> **⚠️ C'est `nombreJours` qui est déduit du solde, pas `joursOuvrables`.**

### 4.2. Algorithme de calcul

#### Étape 1 — Comptage des jours ouvrables de base

Pour chaque jour dans la période `[dateDebut, dateFin]`, vérifier s'il est un jour de travail :
- Un jour est **non-ouvrable** si c'est un jour férié (table `calendrier`) OU s'il n'est pas dans les jours de travail de l'horaire (par défaut : lundi à vendredi).

$$\text{joursOuvrables} = \sum_{d = \text{dateDebut}}^{\text{dateFin}} \begin{cases} 1 & \text{si } d \text{ est un jour de travail} \\ 0 & \text{sinon} \end{cases}$$

#### Étape 2 — Règlement 7.2.1 : Jours fériés sandwichés

> *« Si le salarié demande des jours de congé avant et après une fête nationale ou religieuse, ces derniers lui seront comptabilisés dans leur quota de congés. »*

Si un jour férié tombe un **jour de semaine** (lundi-vendredi) et se trouve **entre** le premier et le dernier jour ouvrable de la période, il est compté comme jour ouvrable supplémentaire.

$$\text{joursOuvrables} = \text{joursOuvrables} + \text{joursFériésSandwichés}$$

**Exemple :** Congé du lundi au vendredi, mercredi est férié → 4 jours travaillés + 1 férié sandwiché = **5 jours ouvrables** déduits.

#### Étape 3 — Extension arrière (pont — jours fériés avant)

Si des **jours fériés** (uniquement, pas les weekends) se trouvent immédiatement avant `dateDebut` de manière consécutive, la date de début effective est reculée.

$$\text{dateDebutEffective} = \text{dateDebut} - \text{jours fériés consécutifs avant}$$

**Exemple :** Congé le lundi 06/01, sachant que le dimanche 05/01 est férié (jour de l'an reporté) → début effectif = 05/01.

#### Étape 4 — Extension avant (weekends et fériés après)

Si des jours **non-ouvrables** (weekends ET/OU fériés) se trouvent immédiatement après `dateFin` de manière consécutive, la date de fin effective est avancée.

$$\text{dateFinEffective} = \text{dateFin} + \text{jours non-ouvrables consécutifs après}$$

**Exemple :** Congé le vendredi → extension automatique au samedi et dimanche → `dateFinEffective` = dimanche.

#### Étape 5 — Calcul du nombreJours

$$\boxed{\text{nombreJours} = \text{dateFinEffective} - \text{dateDebutEffective} + 1}$$

### 4.3. Exemples de calcul

**Exemple 1 — Congé un vendredi (sans jours fériés):**
- `dateDebut` = vendredi 27/03/2026, `dateFin` = vendredi 27/03/2026
- `joursOuvrables` = 1 (vendredi est un jour de travail)
- Extension arrière : rien (jeudi n'est pas férié)
- Extension avant : samedi 28 + dimanche 29 → `dateFinEffective` = 29/03/2026
- **`nombreJours` = 3** (vendredi + samedi + dimanche)
- **3 jours seront déduits du solde**

**Exemple 2 — Congé lundi à vendredi, mercredi férié:**
- `dateDebut` = lundi 06/04, `dateFin` = vendredi 10/04
- Jours de travail : lun, mar, jeu, ven = 4
- Mercredi férié sandwiché = +1
- `joursOuvrables` = 5
- Extension avant : samedi 11 + dimanche 12 → `dateFinEffective` = 12/04
- **`nombreJours` = 7** (lundi à dimanche)

**Exemple 3 — Congé vendredi avec lundi férié (pont):**
- `dateDebut` = vendredi 01/05, `dateFin` = vendredi 01/05
- Mais jeudi 30/04 est férié (fête du travail reportée) ? Non. Admettons lundi 04/05 est férié.
- `joursOuvrables` = 1
- Extension avant : samedi 02 + dimanche 03 + lundi 04 (férié) → `dateFinEffective` = 04/05
- **`nombreJours` = 4**

**Exemple 4 — Congé décès (proche):**
- Quel que soit le calcul, `nombreJours` est **forcé à 5 jours**.

---

## 5. Règles de validation à la création

### 5.1. Validations générales

| # | Règle | Message d'erreur |
|---|---|---|
| 1 | Date de début et date de fin obligatoires | « Les dates de début et fin sont obligatoires » |
| 2 | Date de fin ≥ date de début | « La date de fin doit être après la date de début » |
| 3 | Date de début ≥ aujourd'hui | « La date de début doit être dans le futur » |
| 4 | Le type de congé doit être actif dans les référentiels | « Le type de congé « X » est actuellement désactivé » |
| 5 | Au moins 1 jour ouvrable dans la période | « La période sélectionnée ne contient aucun jour ouvrable » |
| 6 | Pas de chevauchement avec un congé existant | « Un congé existe déjà pour cette période » |

### 5.2. Validations spécifiques par type

| Type | Règle | Message |
|---|---|---|
| `CONGE_PAYE` | `solde < nombreJours` → refusé | « Solde congé insuffisant. Solde actuel: X jours, Demandé: Y jour(s) effectif(s) » |
| `CONGE_PAYE` | Si **tous** les jours ouvrables sont des vendredis → refusé | « Non autorisé : un congé payé ne peut pas couvrir uniquement des vendredis » |
| `CONGE_MALADIE` | `joursOuvrables > 2` → refusé | « Le congé maladie ne peut pas dépasser 2 jours ouvrables » |
| `CONGE_REGLES` | `joursOuvrables > 1` → refusé | « Le congé règles ne peut pas dépasser 1 jour ouvrable » |
| `CONGE_MATERNITE` | Durée calendaire > 90 jours → refusé | « Le congé maternité ne peut pas dépasser 90 jours (60 + 30 de prolongation) » |
| `CONGE_MATERNITE` | Genre ≠ FEMME → refusé | « Le congé maternité est réservé aux salariées de genre féminin » |
| `CONGE_REGLES` | Genre ≠ FEMME → refusé | « Le congé règles est réservé aux salariées de genre féminin » |

### 5.3. Justificatif obligatoire

| Type | Document requis |
|---|---|
| `CONGE_MALADIE` | Certificat médical |
| `CONGE_DECES_PROCHE` | Attestation de décès |
| `CONGE_DECES_FAMILLE` | Attestation de décès |
| `CONGE_MATERNITE` | Certificat médical / attestation d'accouchement |

### 5.4. Règle des 4× (délai de prévenance)

La demande doit être déposée au moins **`nombreJours × 4` jours** avant la date de début. **Cette règle s'applique uniquement au congé payé (`CONGE_PAYE`).**

$$\text{dateLimite} = \text{dateDebut} - (\text{nombreJours} \times 4) \text{ jours}$$

$$\text{Si aujourd'hui} > \text{dateLimite} \Rightarrow \text{Avertissement}$$

Tous les autres types de congé (maternité, maladie, décès, exceptionnel, etc.) sont **exemptés** de cette règle.

### 5.5. Durées fixes (congé décès)

| Type | nombreJours forcé |
|---|---|
| `CONGE_DECES_PROCHE` | **5 jours** (indépendamment du calcul) |
| `CONGE_DECES_FAMILLE` | **1 jour** (indépendamment du calcul) |

---

## 6. Cycle de vie d'une demande

### 6.1. Statuts possibles

```
EN_ATTENTE  ──►  APPROUVEE
     │                │
     ├──►  REFUSEE     │
     │                 │
     └──►  ANNULEE     │
                       │
                  (solde déduit)
```

### 6.2. Actions et impact sur le solde

| Action | Statut avant | Statut après | Impact sur le solde |
|---|---|---|---|
| **Créer** | — | `EN_ATTENTE` | Aucun (le solde n'est pas encore déduit) |
| **Approuver** | `EN_ATTENTE` | `APPROUVEE` | **Déduction de `nombreJours`** du solde (congé payé uniquement) |
| **Refuser** | `EN_ATTENTE` | `REFUSEE` | Aucun (le solde n'avait pas été déduit) |
| **Annuler** | `EN_ATTENTE` | `ANNULEE` | Aucun (le solde n'avait pas été déduit) |
| **Modifier** | `EN_ATTENTE` | `EN_ATTENTE` | Aucun (recalcul des jours, le solde sera vérifié) |

> **⚠️ Important :** Le solde n'est déduit qu'au moment de l'**approbation**. Tant qu'une demande est en attente, les jours apparaissent dans `joursEnAttente` et réduisent le `soldePrévisionnel` mais pas le `soldeDisponible`.

### 6.3. Formule de déduction à l'approbation

Pour les congés payés uniquement :

$$\text{nouveauSolde} = \text{soldeCourant} - \text{conge.nombreJours}$$

---

## 7. Exemples pratiques

### Exemple complet — Nouvel employé

**Données :**
- Date d'embauche : 01/09/2025
- Date actuelle : 08/03/2026
- Ancienneté : 0 an, 6 mois → **1ère année**
- Taux mensuel : 1.5 j/mois
- Droit annuel : 18 j/an

**Calcul :**
1. Année de congé : 01/09/2025 → 31/08/2026
2. Mois travaillés : 6 mois (sept, oct, nov, déc, jan, fév) + 8 jours en mars (< 15) → **6 mois**
3. Jours acquis : min(6 × 1.5, 18) = **9 jours**
4. Report : 0 (1ère année, pas d'année précédente)
5. Congés payés approuvés cette année : 1 congé de 3j (nombreJours) → consommés = **3j**
6. Congés payés en attente : 1 congé de 3j (nombreJours) → en attente = **3j**

**Résultat :**
- Solde disponible = max(0, 9 - 3) = **6 jours**
- Solde prévisionnel = max(0, 9 - 3 - 3) = **3 jours**

### Exemple — Report de congé

**Données :**
- Date d'embauche : 15/01/2024
- Date actuelle : 20/03/2026
- Ancienneté : 2 ans → **AN2_PLUS**
- Année congé précédente : 15/01/2025 → 14/01/2026
- Acquis année précédente : min(12 × 2, 24) = 24 jours
- Consommés année précédente : 16 jours (nombreJours)
- MAX_REPORT_CONGE : 5 jours

**Calcul du report :**
1. Reliquat = max(0, 24 - 16) = **8 jours**
2. Report = min(8, 5) = **5 jours** (plafonné)

**Année courante (15/01/2026 → 14/01/2027) :**
1. Mois travaillés : 2 mois (fév, mars)
2. Acquis = min(2 × 2, 24) = **4 jours**
3. Acquis total = 4 + 5 (report) = **9 jours**

---

> **Fichiers source :**
> - Calcul solde : `Backend/src/main/java/com/antigone/rh/service/EmployeService.java` → méthode `getSoldeCongeInfo()`
> - Création/validation congé : `Backend/src/main/java/com/antigone/rh/service/DemandeService.java` → méthode `createConge()`
> - Calcul jours effectifs : `Backend/src/main/java/com/antigone/rh/service/DemandeService.java` → méthode `computeEffectiveDays()`
> - Paramètres système : `Backend/src/main/java/com/antigone/rh/config/DataInitializer.java` → méthode `initSystemParameters()`
> - Types de congé : `Backend/src/main/java/com/antigone/rh/enums/TypeConge.java`
