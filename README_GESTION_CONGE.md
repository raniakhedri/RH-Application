# Gestion des Congés — Implémentation complète

## Référence : Règlement Intérieur ANTIGONE CONSULTING

Ce document décrit **exactement** toutes les règles métier implémentées dans le système de gestion des congés, en correspondance avec le règlement intérieur.

---

## 1. Types de congés supportés

| Enum (`TypeConge`) | Label | Article du règlement |
|---|---|---|
| `CONGE_PAYE` | Congé payé | Art. 7.2.1 |
| `CONGE_MALADIE` | Congé maladie | Art. 7.2.2 |
| `CONGE_MATERNITE` | Congé maternité | Art. 7.2.3 |
| `CONGE_PATERNITE` | Congé paternité | — |
| `CONGE_SANS_SOLDE` | Congé sans solde | Art. 7.3 |
| `CONGE_EXCEPTIONNEL` | Congé exceptionnel | Art. 7.2.2 |
| `CONGE_FORMATION` | Congé formation | Art. 12 |
| `CONGE_RECUPERATION` | Congé récupération | — |
| `CONGE_ADMINISTRATIF` | Congé administratif | — |
| `CONGE_REGLES` | Congé règles | — |
| `CONGE_DECES_PROCHE` | Congé décès (parent, grand-parent, enfant) | Art. 7.2.4 |
| `CONGE_DECES_FAMILLE` | Congé décès (autre famille) | Art. 7.2.4 |

**Fichier** : `Backend/src/main/java/com/antigone/rh/enums/TypeConge.java`

---

## 2. Acquisition du solde congé (Art. 7.2.1)

### Règle du règlement :
> « Le salarié bénéficie d'un jour et demi de congés payés pour chaque mois travaillé pour la première année de travail et deux jours de congés payés par mois pour chaque mois travaillé à partir de la deuxième année de service. »

### Implémentation (`EmployeService.getSoldeCongeInfo()`) :

| Ancienneté | Droit annuel | Taux mensuel |
|---|---|---|
| 1ère année (< 12 mois) | 18 jours | 1.5 jours/mois |
| 2ème année et + (≥ 12 mois) | 24 jours | 2.0 jours/mois |

- **Année de congé** : basée sur l'anniversaire d'embauche (pas l'année calendaire)
- **Mois partiel** : un mois partiel de ≥ 15 jours calendaires compte comme un mois complet
- **Formule** : `joursAcquis = min(moisTravaillés × tauxMensuel, droitAnnuel)`
- **Taux configurables** via les référentiels : `SOLDE_CONGE_AN1`, `SOLDE_CONGE_AN2_PLUS`, `TAUX_MENSUEL_AN1`, `TAUX_MENSUEL_AN2_PLUS`

### Restriction "mois non travaillé" (NOUVEAU) :

> Règle : un salarié qui n'a pas travaillé pendant un mois complet (congé sans solde couvrant tous les jours ouvrables du mois) ne bénéficie pas de ses 1.5 ou 2 jours pour ce mois.

**Implémentation** :
- Pour chaque mois de l'année de congé en cours, le système :
  1. Compte les jours ouvrables du mois (`countWorkingDaysInPeriod`)
  2. Compte les jours de congé sans solde approuvé (`CONGE_SANS_SOLDE` + `APPROUVEE`) qui chevauchent ce mois
  3. Si les jours de congé sans solde ≥ jours ouvrables du mois → ce mois est considéré comme **non travaillé**
  4. Le `moisTravaillés` est réduit en conséquence → l'acquisition est réduite

**Exemple** : Un salarié en 1ère année prend un congé sans solde tout le mois de mars (22 jours ouvrables). Mars est exclu → il acquiert 1.5 × (mois - 1) au lieu de 1.5 × mois.

**Fichiers modifiés** :
- `EmployeService.java` — ajout de la boucle de vérification mois par mois
- `EmployeService.java` — ajout de `countWorkingDaysInPeriod()` : compte les jours Lun-Ven hors fériés
- `EmployeService.java` — ajout de `CalendrierRepository` pour accéder aux jours fériés
- `CongeRepository.java` — nouvelle méthode `findOverlappingByTypeCongeAndStatut()` pour trouver les congés sans solde qui chevauchent une période

---

## 3. Report de congés (Art. 7.2.1)

### Règle du règlement :
> « Les congés payés non utilisés peuvent être reportés l'année suivante sans que le report dépasse les 05 jours. »

### Implémentation :
- **Max report** : 5 jours (configurable via `MAX_REPORT_CONGE`)
- **Formule** : `joursReportés = min(acquisAnPrécédent - consommésAnPrécédent, maxReport)`
- Le report s'ajoute aux jours acquis de l'année en cours
- S'applique uniquement à partir de la 2ème année (`ancienneteAnnees >= 1`)

### Correction du calcul de l'année précédente (NOUVEAU) :
- **Avant** : l'acquisition de l'année précédente était toujours `prevDroit` (droit complet = 18 ou 24 jours), même si la 1ère année était une année partielle
- **Après** : si l'année précédente était la 1ère année, on calcule les mois réellement travaillés et on proratise : `prevAcquis = min(prevMoisTravaillés × prevTaux, prevDroit)`

---

## 4. Cohérence des unités de jours (CORRECTION)

### Problème détecté :
Le système utilisait `nombreJours` (jours calendaires étendus, incluant weekends/fériés) pour calculer les jours consommés et en attente dans `getSoldeCongeInfo()`, mais `joursOuvrables` (jours travaillés uniquement) pour la déduction lors de l'approbation.

### Correction :
- **`getSoldeCongeInfo()`** utilise maintenant `joursOuvrables` en priorité (avec fallback sur `nombreJours` si `joursOuvrables` est null ou 0)
- **Approbation (`approve()`)** utilise `joursOuvrables` (inchangé)
- **Vérification de solde (`createConge()`)** utilise `joursOuvrables` (inchangé)

→ Unité cohérente partout : **jours ouvrables**.

---

## 5. Jours fériés "sandwichés" (Art. 7.2.1) — NOUVEAU

### Règle du règlement :
> « Si le salarié demande des jours de congé avant et après une fête nationale ou religieuse, ces derniers lui seront comptabilisés dans leur quota de congés. »

### Implémentation (`computeEffectiveDays()`) :
- Quand un jour férié (Lun-Ven) tombe **entre** le premier et le dernier jour ouvrable d'une période de congé, ce jour férié est ajouté aux `joursOuvrables` déduits du solde
- **Exemple** : Lundi congé + Mardi férié + Mercredi congé → `joursOuvrables = 3` (Lundi + Mardi sandwiché + Mercredi) au lieu de 2

**Fichier** : `DemandeService.java` — dans `computeEffectiveDays()`, ajout de la détection des jours fériés sandwichés

---

## 6. Règle des 4× (Art. 7.2.1)

### Règle du règlement :
> « en le remettant au responsable du personnel [...] avant 4 fois la durée désignée dans la demande de congé »

### Implémentation :
- La demande doit être soumise au moins `nombreJours × 4` jours avant la date de début
- **Exemptions** : `CONGE_MALADIE`, `CONGE_DECES_PROCHE`, `CONGE_DECES_FAMILLE`, `CONGE_EXCEPTIONNEL`
- Message d'erreur détaillé avec la date limite calculée

---

## 7. Congé maladie (Art. 7.2.2)

### Règle du règlement :
> « Le congé exceptionnel pour maladie doit être justifié par un certificat médical [...] avec une durée maximum de 2 jours. »

### Implémentation :
- **Maximum** : 2 jours ouvrables
- **Justificatif obligatoire** : certificat médical
- **Exempt** de la règle des 4×
- Message d'erreur si > 2 jours ouvrables sélectionnés

---

## 8. Congé maternité (Art. 7.2.3) — NOUVEAU

### Règle du règlement :
> « Les femmes salariées bénéficient d'un congé de maternité de 2 mois à partir du jour de l'accouchement. [...] Une prolongation exceptionnelle du congé de maternité n'excédant pas un mois pourra être accordée. »

### Implémentation :
- **Durée maximale** : 90 jours calendaires (2 mois + 1 mois prolongation max)
- **Justificatif obligatoire** : certificat médical / attestation d'accouchement
- **Restriction de genre** : réservé aux employées de genre `FEMME` uniquement
- Message d'erreur si durée > 90 jours calendaires

---

## 9. Congé décès (Art. 7.2.4)

### Règle du règlement :
> « Le salarié bénéficie d'un congé de 5 jours en cas de décès d'un parent, grand-parent ou enfant. [...] Le salarié bénéficie d'un congé d'un jour en cas de décès d'un autre membre de la famille. »

### Implémentation :
| Type | Jours | Justificatif |
|---|---|---|
| `CONGE_DECES_PROCHE` (parent, grand-parent, enfant) | 5 jours (fixe, override) | Attestation de décès obligatoire |
| `CONGE_DECES_FAMILLE` (autre membre) | 1 jour (fixe, override) | Attestation de décès obligatoire |

- Exemptés de la règle des 4×
- Le `nombreJours` est forcé à 5 ou 1 quelle que soit la période sélectionnée

---

## 10. Congé sans solde (Art. 7.3)

### Règle du règlement :
> « Les jours de congé non payés sont amputés du salaire. »

### Implémentation :
- Aucune déduction du solde congé payé
- La demande est soumise aux mêmes règles que le congé payé (règle des 4×, chevauchement, etc.)
- **Impact sur l'acquisition** : si un congé sans solde couvre un mois complet de jours ouvrables → ce mois ne donne pas droit à l'accrual (voir section 2)

---

## 11. Congé règles — NOUVEAU (validation genre)

### Implémentation :
- **Maximum** : 1 jour ouvrable
- **Restriction de genre** : réservé aux employées de genre `FEMME` uniquement

---

## 12. Autorisations (Art. 7.4)

### Règle du règlement :
> « L'autorisation de s'absenter peut varier d'une heure à 2 heures. »

### Implémentation :
- **Durée max par autorisation** : 120 minutes (2h) — configurable via `MAX_AUTORISATION_MINUTES`
- **Quota mensuel** : la somme des autorisations (EN_ATTENTE + APPROUVEE) du mois ≤ 120 minutes
- **Validation des horaires** : l'autorisation doit être dans les heures de travail (`HEURE_DEBUT_TRAVAIL` / `HEURE_FIN_TRAVAIL`)
- **Validation du jour** : le jour doit être un jour de travail (`JOURS_TRAVAIL`)

---

## 13. Fêtes nationales et religieuses (Art. 7.1)

### Règle du règlement :
Les fêtes suivantes sont des jours de congé :
- 1er janvier, 25 décembre, 20 mars, 1er mai, 25 juillet
- Aïd al-Fitr (2j), Aïd al-Adha (2j), Mouled (1j), Ras el Am el Hejri (1j)

### Implémentation :
- Gérés via la table `calendrier` avec `typeJour = FERIE`
- Pris en compte dans :
  - `computeEffectiveDays()` : exclus des jours ouvrables (sauf sandwichage)
  - `countWorkingDaysInPeriod()` : exclus du décompte
  - Extension avant/arrière : les jours fériés consécutifs avant le congé (pont) et les weekends/fériés après le congé étendent le `nombreJours` calendaire

---

## 14. Règle du vendredi seul

### Implémentation :
- Si un congé payé ne contient que des vendredis comme jours ouvrables → il est **refusé** et le salarié doit utiliser `CONGE_SANS_SOLDE`
- Vérifié via `isOnlyFridays()`

---

## 15. Vérification de chevauchement

### Implémentation :
- Avant la création d'un congé, le système vérifie qu'aucun congé existant (hors REFUSEE/ANNULEE) ne chevauche la période demandée
- Requête JPQL dans `CongeRepository.findOverlapping()`

---

## 16. Calcul des jours effectifs (`computeEffectiveDays()`)

Cette méthode centrale calcule :
1. **Jours ouvrables** : Lun-Ven hors fériés dans la période [dateDebut, dateFin]
2. **Jours fériés sandwichés** (NOUVEAU) : fériés en semaine entre le 1er et dernier jour ouvrable → ajoutés aux jours ouvrables
3. **Extension arrière (pont)** : jours fériés consécutifs immédiatement avant dateDebut → étendent le début effectif
4. **Extension avant** : weekends + fériés consécutifs après dateFin → étendent la fin effective
5. **Nombre de jours total** : jours calendaires entre début effectif et fin effective

---

## Résumé des fichiers modifiés

| Fichier | Modifications |
|---|---|
| `EmployeService.java` | Ajout `CalendrierRepository`, restriction "mois non travaillé" pour l'acquisition, correction du report année partielle, `joursOuvrables` pour jours consommés/en attente, méthode `countWorkingDaysInPeriod()` |
| `DemandeService.java` | Validation genre (maternité/règles), plafond maternité 90j, jours fériés sandwichés dans `computeEffectiveDays()` |
| `CongeRepository.java` | Nouvelle méthode `findOverlappingByTypeCongeAndStatut()` pour la recherche de congés sans solde chevauchants |

---

## Résumé des règles du règlement vs implémentation

| # | Règle du règlement | Article | Statut |
|---|---|---|---|
| 1 | 1.5 j/mois 1ère année, 2 j/mois ensuite | 7.2.1 | ✅ Implémenté |
| 2 | "Pour chaque mois **travaillé**" — mois sans travail = pas d'acquisition | 7.2.1 | ✅ Implémenté (NOUVEAU) |
| 3 | Report max 5 jours | 7.2.1 | ✅ Implémenté |
| 4 | Demande 4× durée à l'avance | 7.2.1 | ✅ Implémenté |
| 5 | Jours fériés sandwichés comptabilisés | 7.2.1 | ✅ Implémenté (NOUVEAU) |
| 6 | Congé maladie max 2j + certificat | 7.2.2 | ✅ Implémenté |
| 7 | Congé maternité 2 mois + 1 mois prolongation | 7.2.3 | ✅ Implémenté (NOUVEAU) |
| 8 | Congé maternité réservé aux femmes | 7.2.3 | ✅ Implémenté (NOUVEAU) |
| 9 | Congé décès 5j (proche) / 1j (famille) + attestation | 7.2.4 | ✅ Implémenté |
| 10 | Congé sans solde amputé du salaire | 7.3 | ✅ Implémenté (pas de déduction solde) |
| 11 | Autorisation 1h à 2h | 7.4 | ✅ Implémenté |
| 12 | Fêtes nationales et religieuses | 7.1 | ✅ Via table calendrier |
| 13 | Vendredi seul = sans solde | — | ✅ Implémenté |
| 14 | Congé règles réservé aux femmes | — | ✅ Implémenté (NOUVEAU) |
| 15 | Cohérence unités joursOuvrables | — | ✅ Corrigé (NOUVEAU) |
