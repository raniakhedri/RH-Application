package com.antigone.rh.service;

import com.antigone.rh.dto.*;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutProjet;
import com.antigone.rh.enums.StatutTache;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AdminDashboardService {

    /** Fixed threshold: manager must assign tasks within 12h of project creation */
    private static final long MANAGER_ASSIGN_THRESHOLD_HOURS = 12L;

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build the global admin dashboard with KPIs, project summaries, and alerts.
     */
    public AdminDashboardDTO getDashboard() {
        List<Projet> allProjets = projetRepository.findAll();
        List<Tache> allTaches = tacheRepository.findAll();

        // Global KPIs
        int totalProjets = allProjets.size();
        int projetsActifs = (int) allProjets.stream()
                .filter(p -> p.getStatut() == StatutProjet.EN_COURS).count();
        int projetsPlanifies = (int) allProjets.stream()
                .filter(p -> p.getStatut() == StatutProjet.PLANIFIE).count();
        int projetsClotures = (int) allProjets.stream()
                .filter(p -> p.getStatut() == StatutProjet.CLOTURE || p.getStatut() == StatutProjet.CLOTURE_INCOMPLET).count();

        int totalTaches = allTaches.size();
        int tachesDone = (int) allTaches.stream().filter(t -> t.getStatut() == StatutTache.DONE).count();
        int tachesInProgress = (int) allTaches.stream().filter(t -> t.getStatut() == StatutTache.IN_PROGRESS).count();
        int tachesTodo = (int) allTaches.stream().filter(t -> t.getStatut() == StatutTache.TODO).count();

        // Build per-project summaries
        List<ProjetSummaryDTO> projetSummaries = allProjets.stream()
                .filter(p -> p.getStatut() != StatutProjet.ANNULE)
                .map(p -> buildProjetSummary(p, tacheRepository.findByProjetId(p.getId())))
                .collect(Collectors.toList());

        // Compute late tasks count
        int tachesEnRetard = projetSummaries.stream().mapToInt(ProjetSummaryDTO::getTachesEnRetard).sum();

        // Average progression
        double progressionMoyenne = projetSummaries.isEmpty() ? 0 :
                projetSummaries.stream().mapToDouble(ProjetSummaryDTO::getProgressionPourcentage).average().orElse(0);

        // Generate alerts
        List<AlerteDTO> alertes = generateAlertes(allProjets, allTaches);

        return AdminDashboardDTO.builder()
                .totalProjets(totalProjets)
                .projetsActifs(projetsActifs)
                .projetsPlanifies(projetsPlanifies)
                .projetsClotures(projetsClotures)
                .totalTaches(totalTaches)
                .tachesDone(tachesDone)
                .tachesInProgress(tachesInProgress)
                .tachesTodo(tachesTodo)
                .tachesEnRetard(tachesEnRetard)
                .progressionMoyenne(Math.round(progressionMoyenne * 10.0) / 10.0)
                .projets(projetSummaries)
                .alertes(alertes)
                .build();
    }

    /**
     * Detailed view of a single project for admin.
     */
    public ProjetDetailAdminDTO getProjetDetail(Long projetId) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + projetId));
        List<Tache> taches = tacheRepository.findByProjetId(projetId);

        // Basic info
        String clientNom = null;
        Long clientId = null;
        try {
            if (projet.getClient() != null) {
                clientNom = projet.getClient().getNom();
                clientId = projet.getClient().getId();
            }
        } catch (Exception ignored) {}

        int totalTaches = taches.size();
        int done = (int) taches.stream().filter(t -> t.getStatut() == StatutTache.DONE).count();
        int inProgress = (int) taches.stream().filter(t -> t.getStatut() == StatutTache.IN_PROGRESS).count();
        int todo = (int) taches.stream().filter(t -> t.getStatut() == StatutTache.TODO).count();
        double progression = totalTaches > 0 ? (done * 100.0 / totalTaches) : 0;
        int enRetard = (int) taches.stream().filter(this::isTacheEnRetard).count();

        // Build manager sections
        List<ProjetDetailAdminDTO.ManagerSectionDTO> managerSections = buildManagerSections(projet, taches);

        // Build employee sections
        List<ProjetDetailAdminDTO.EmployeSectionDTO> employeSections = buildEmployeSections(taches);

        // Build timeline
        List<ProjetDetailAdminDTO.TacheTimelineDTO> timeline = buildTimeline(projet, taches);

        // Build project-specific alerts
        List<AlerteDTO> alertes = generateAlertesForProjet(projet, taches);

        return ProjetDetailAdminDTO.builder()
                .projetId(projet.getId())
                .projetNom(projet.getNom())
                .clientNom(clientNom)
                .clientId(clientId)
                .statut(projet.getStatut() != null ? projet.getStatut().name() : null)
                .dateDebut(projet.getDateDebut())
                .dateFin(projet.getDateFin())
                .typeProjet(projet.getTypeProjet())
                .progressionPourcentage(Math.round(progression * 10.0) / 10.0)
                .totalTaches(totalTaches)
                .tachesDone(done)
                .tachesInProgress(inProgress)
                .tachesTodo(todo)
                .tachesEnRetard(enRetard)
                .managers(managerSections)
                .employes(employeSections)
                .timeline(timeline)
                .alertes(alertes)
                .build();
    }

    /**
     * Return all current alerts across all projects.
     */
    public List<AlerteDTO> getAlertes() {
        List<Projet> allProjets = projetRepository.findAll();
        List<Tache> allTaches = tacheRepository.findAll();
        return generateAlertes(allProjets, allTaches);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROJECT SUMMARY BUILDER
    // ─────────────────────────────────────────────────────────────────────────

    private ProjetSummaryDTO buildProjetSummary(Projet projet, List<Tache> taches) {
        int total = taches.size();
        int done = (int) taches.stream().filter(t -> t.getStatut() == StatutTache.DONE).count();
        int inProgress = (int) taches.stream().filter(t -> t.getStatut() == StatutTache.IN_PROGRESS).count();
        int todo = (int) taches.stream().filter(t -> t.getStatut() == StatutTache.TODO).count();
        int enRetard = (int) taches.stream().filter(this::isTacheEnRetard).count();
        double progression = total > 0 ? (done * 100.0 / total) : 0;

        String clientNom = null;
        try {
            if (projet.getClient() != null) clientNom = projet.getClient().getNom();
        } catch (Exception ignored) {}

        List<String> managerNoms = new ArrayList<>();
        List<Long> managerIds = new ArrayList<>();
        try {
            if (projet.getChefsDeProjet() != null) {
                for (Employe chef : projet.getChefsDeProjet()) {
                    managerNoms.add(chef.getPrenom() + " " + chef.getNom());
                    managerIds.add(chef.getId());
                }
            }
            if (managerNoms.isEmpty() && projet.getChefDeProjet() != null) {
                Employe chef = projet.getChefDeProjet();
                managerNoms.add(chef.getPrenom() + " " + chef.getNom());
                managerIds.add(chef.getId());
            }
        } catch (Exception ignored) {}

        return ProjetSummaryDTO.builder()
                .projetId(projet.getId())
                .projetNom(projet.getNom())
                .clientNom(clientNom)
                .statut(projet.getStatut() != null ? projet.getStatut().name() : null)
                .managerNoms(managerNoms)
                .managerIds(managerIds)
                .progressionPourcentage(Math.round(progression * 10.0) / 10.0)
                .totalTaches(total)
                .tachesDone(done)
                .tachesInProgress(inProgress)
                .tachesTodo(todo)
                .tachesEnRetard(enRetard)
                .dateDebut(projet.getDateDebut())
                .dateFin(projet.getDateFin())
                .typeProjet(projet.getTypeProjet())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANAGER SECTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private List<ProjetDetailAdminDTO.ManagerSectionDTO> buildManagerSections(Projet projet, List<Tache> taches) {
        // Group managers from project chefs
        Map<Long, String> managerMap = new LinkedHashMap<>();
        try {
            if (projet.getChefsDeProjet() != null) {
                for (Employe chef : projet.getChefsDeProjet()) {
                    managerMap.put(chef.getId(), chef.getPrenom() + " " + chef.getNom());
                }
            }
            if (managerMap.isEmpty() && projet.getChefDeProjet() != null) {
                Employe chef = projet.getChefDeProjet();
                managerMap.put(chef.getId(), chef.getPrenom() + " " + chef.getNom());
            }
        } catch (Exception ignored) {}

        List<ProjetDetailAdminDTO.ManagerSectionDTO> sections = new ArrayList<>();
        for (Map.Entry<Long, String> entry : managerMap.entrySet()) {
            List<ProjetDetailAdminDTO.TacheManagerDTO> tacheDTOs = taches.stream()
                    .map(this::buildTacheManagerDTO)
                    .collect(Collectors.toList());

            sections.add(ProjetDetailAdminDTO.ManagerSectionDTO.builder()
                    .managerId(entry.getKey())
                    .managerNom(entry.getValue())
                    .taches(tacheDTOs)
                    .build());
        }

        // If no manager, still show tasks under "Non assigné"
        if (sections.isEmpty() && !taches.isEmpty()) {
            sections.add(ProjetDetailAdminDTO.ManagerSectionDTO.builder()
                    .managerId(null)
                    .managerNom("Non assigné")
                    .taches(taches.stream().map(this::buildTacheManagerDTO).collect(Collectors.toList()))
                    .build());
        }

        return sections;
    }

    private ProjetDetailAdminDTO.TacheManagerDTO buildTacheManagerDTO(Tache tache) {
        String employeNom = null;
        Long employeId = null;
        try {
            if (tache.getAssignee() != null) {
                employeNom = tache.getAssignee().getPrenom() + " " + tache.getAssignee().getNom();
                employeId = tache.getAssignee().getId();
            }
        } catch (Exception ignored) {}

        // CORRECTION 1: Use toMinutes()/60.0 instead of toHours() to avoid truncation
        Double dureeReelle = null;
        if (tache.getDateDebutExecution() != null && tache.getDateFinExecution() != null) {
            dureeReelle = Duration.between(tache.getDateDebutExecution(), tache.getDateFinExecution()).toMinutes() / 60.0;
            dureeReelle = Math.round(dureeReelle * 100.0) / 100.0; // 2 decimal precision
        } else if (tache.getDateAssignation() != null && tache.getDateFinExecution() != null) {
            dureeReelle = Duration.between(tache.getDateAssignation(), tache.getDateFinExecution()).toMinutes() / 60.0;
            dureeReelle = Math.round(dureeReelle * 100.0) / 100.0;
        }

        boolean enRetard = isTacheEnRetard(tache);
        String statutRetard = getStatutRetard(tache);

        return ProjetDetailAdminDTO.TacheManagerDTO.builder()
                .tacheId(tache.getId())
                .tacheNom(tache.getTitre())
                .employeNom(employeNom)
                .employeId(employeId)
                .statut(tache.getStatut().name())
                .dateEcheance(tache.getDateEcheance())
                .dureePrevueJours(tache.getDureePrevueJours())
                .dateAssignation(tache.getDateAssignation())
                .dateDebutExecution(tache.getDateDebutExecution())
                .dateFinExecution(tache.getDateFinExecution())
                .dureeReelleHeures(dureeReelle)
                .enRetard(enRetard)
                .statutRetard(statutRetard)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMPLOYEE SECTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private List<ProjetDetailAdminDTO.EmployeSectionDTO> buildEmployeSections(List<Tache> taches) {
        LocalDateTime now = LocalDateTime.now();

        // Group tasks by assignee
        Map<Long, List<Tache>> byEmployee = new LinkedHashMap<>();
        for (Tache t : taches) {
            if (t.getAssignee() != null) {
                byEmployee.computeIfAbsent(t.getAssignee().getId(), k -> new ArrayList<>()).add(t);
            }
        }

        List<ProjetDetailAdminDTO.EmployeSectionDTO> sections = new ArrayList<>();
        for (Map.Entry<Long, List<Tache>> entry : byEmployee.entrySet()) {
            List<Tache> empTaches = entry.getValue();
            Employe emp = empTaches.get(0).getAssignee();
            String empNom = emp.getPrenom() + " " + emp.getNom();

            int total = empTaches.size();
            int done = (int) empTaches.stream().filter(t -> t.getStatut() == StatutTache.DONE).count();
            int enRetard = (int) empTaches.stream().filter(this::isTacheEnRetard).count();
            int enCours = (int) empTaches.stream().filter(t -> t.getStatut() == StatutTache.IN_PROGRESS).count();
            int todoCnt = (int) empTaches.stream().filter(t -> t.getStatut() == StatutTache.TODO).count();

            // Average execution time for done tasks (fractional hours)
            Double tempsMoyen = empTaches.stream()
                    .filter(t -> t.getStatut() == StatutTache.DONE
                            && t.getDateDebutExecution() != null
                            && t.getDateFinExecution() != null)
                    .mapToDouble(t -> Duration.between(t.getDateDebutExecution(), t.getDateFinExecution()).toMinutes() / 60.0)
                    .average()
                    .orElse(0);

            // ── Per-status time breakdown ──────────────────────────────────
            long tempsEnTodo = 0;
            long tempsEnInProgress = 0;
            long tempsDepuisDone = 0;
            long tempsTotal = 0;

            for (Tache t : empTaches) {
                LocalDateTime assignation = t.getDateAssignation();
                LocalDateTime debut = t.getDateDebutExecution();
                LocalDateTime fin = t.getDateFinExecution();

                // Temps en TODO
                if (assignation != null) {
                    if (debut != null) {
                        tempsEnTodo += Math.max(Duration.between(assignation, debut).toMinutes(), 0);
                    } else if (t.getStatut() == StatutTache.TODO) {
                        tempsEnTodo += Math.max(Duration.between(assignation, now).toMinutes(), 0);
                    }
                }

                // Temps en IN_PROGRESS
                if (debut != null) {
                    if (fin != null) {
                        tempsEnInProgress += Math.max(Duration.between(debut, fin).toMinutes(), 0);
                    } else if (t.getStatut() == StatutTache.IN_PROGRESS) {
                        tempsEnInProgress += Math.max(Duration.between(debut, now).toMinutes(), 0);
                    }
                }

                // Temps depuis DONE
                if (fin != null && t.getStatut() == StatutTache.DONE) {
                    tempsDepuisDone += Math.max(Duration.between(fin, now).toMinutes(), 0);
                }

                // Temps total
                if (assignation != null) {
                    LocalDateTime endRef = fin != null ? fin : now;
                    tempsTotal += Math.max(Duration.between(assignation, endRef).toMinutes(), 0);
                }
            }

            sections.add(ProjetDetailAdminDTO.EmployeSectionDTO.builder()
                    .employeId(entry.getKey())
                    .employeNom(empNom)
                    .tachesAssignees(total)
                    .tachesDone(done)
                    .tachesEnRetard(enRetard)
                    .tachesEnCours(enCours)
                    .tachesTodo(todoCnt)
                    .tempsMoyenHeures(Math.round(tempsMoyen * 10.0) / 10.0)
                    .tempsEnTodoMinutes(tempsEnTodo)
                    .tempsEnInProgressMinutes(tempsEnInProgress)
                    .tempsDepuisDoneMinutes(tempsDepuisDone)
                    .tempsTotalMinutes(tempsTotal)
                    .taches(empTaches.stream().map(this::buildTacheManagerDTO).collect(Collectors.toList()))
                    .build());
        }

        return sections;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIMELINE
    // ─────────────────────────────────────────────────────────────────────────

    private List<ProjetDetailAdminDTO.TacheTimelineDTO> buildTimeline(Projet projet, List<Tache> taches) {
        return taches.stream().map(t -> {
            String empNom = null;
            try {
                if (t.getAssignee() != null) {
                    empNom = t.getAssignee().getPrenom() + " " + t.getAssignee().getNom();
                }
            } catch (Exception ignored) {}

            int progress = 0;
            if (t.getStatut() == StatutTache.DONE) progress = 100;
            else if (t.getStatut() == StatutTache.IN_PROGRESS) progress = 50;

            return ProjetDetailAdminDTO.TacheTimelineDTO.builder()
                    .tacheId(t.getId())
                    .tacheNom(t.getTitre())
                    .employeNom(empNom)
                    .statut(t.getStatut().name())
                    .dateEcheance(t.getDateEcheance())
                    .dateAssignation(t.getDateAssignation())
                    .dateDebutExecution(t.getDateDebutExecution())
                    .dateFinExecution(t.getDateFinExecution())
                    .dureePrevueJours(t.getDureePrevueJours())
                    .enRetard(isTacheEnRetard(t))
                    .progressPourcent(progress)
                    .projetDateDebut(projet.getDateDebut())
                    .projetDateFin(projet.getDateFin())
                    .build();
        }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ALERT GENERATION — Dynamic thresholds based on deadline
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Dynamic alert thresholds:
     * - TODO: alert when 50% of time before deadline has passed without starting
     * - IN_PROGRESS: alert when 75% of time before deadline has passed without finishing
     * - OVERDUE: immediately when deadline is passed
     * - MANAGER: 12h after project creation without task assignment (fixed)
     */
    public List<AlerteDTO> generateAlertes(List<Projet> projets, List<Tache> taches) {
        List<AlerteDTO> alertes = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Tache t : taches) {
            if (t.getStatut() == StatutTache.DONE) continue;
            if (t.getDateEcheance() == null) continue;

            LocalDateTime deadline = t.getDateEcheance().atTime(23, 59, 59);

            // Determine reference start time: assignation > creation > project start
            LocalDateTime referenceStart = t.getDateAssignation();
            if (referenceStart == null) referenceStart = t.getDateCreation();
            if (referenceStart == null && t.getProjet() != null && t.getProjet().getDateDebut() != null) {
                referenceStart = t.getProjet().getDateDebut().atStartOfDay();
            }
            if (referenceStart == null) continue;

            long totalMinutes = ChronoUnit.MINUTES.between(referenceStart, deadline);
            if (totalMinutes <= 0) totalMinutes = 1;
            long elapsedMinutes = ChronoUnit.MINUTES.between(referenceStart, now);
            double progressPercent = (double) elapsedMinutes / totalMinutes * 100;

            String projetNom = null;
            Long projetId = null;
            String managerNom = null;
            try {
                if (t.getProjet() != null) {
                    projetNom = t.getProjet().getNom();
                    projetId = t.getProjet().getId();
                    if (t.getProjet().getChefDeProjet() != null) {
                        Employe chef = t.getProjet().getChefDeProjet();
                        managerNom = chef.getPrenom() + " " + chef.getNom();
                    }
                }
            } catch (Exception ignored) {}

            String employeNom = null;
            try {
                if (t.getAssignee() != null) {
                    employeNom = t.getAssignee().getPrenom() + " " + t.getAssignee().getNom();
                }
            } catch (Exception ignored) {}

            // 🔴 OVERDUE — deadline is passed
            if (now.isAfter(deadline)) {
                long retardMinutes = ChronoUnit.MINUTES.between(deadline, now);
                double retardJours = retardMinutes / 1440.0;
                alertes.add(AlerteDTO.builder()
                        .niveau("CRITIQUE")
                        .projetNom(projetNom)
                        .projetId(projetId)
                        .tacheNom(t.getTitre())
                        .tacheId(t.getId())
                        .employeNom(employeNom)
                        .managerNom(managerNom)
                        .probleme("Deadline dépassée depuis " + formatDuration(retardMinutes))
                        .actionSuggere("Relancer l'employé ou réassigner la tâche au plus vite")
                        .retardJours(Math.round(retardJours * 10.0) / 10.0)
                        .dateDetection(now)
                        .build());
                continue;
            }

            // ⚠ TODO > 50% of time passed without starting
            if (t.getStatut() == StatutTache.TODO && progressPercent >= 50) {
                long tempsRestant = ChronoUnit.MINUTES.between(now, deadline);
                alertes.add(AlerteDTO.builder()
                        .niveau(progressPercent >= 80 ? "CRITIQUE" : "WARNING")
                        .projetNom(projetNom)
                        .projetId(projetId)
                        .tacheNom(t.getTitre())
                        .tacheId(t.getId())
                        .employeNom(employeNom)
                        .managerNom(managerNom)
                        .probleme("Tâche non démarrée — " + Math.round(progressPercent)
                                + "% du temps écoulé, il reste " + formatDuration(tempsRestant))
                        .actionSuggere("Contacter l'employé assigné pour démarrer la tâche")
                        .retardJours(0)
                        .dateDetection(now)
                        .build());
                continue;
            }

            // ⚠ IN_PROGRESS > 75% of time passed without finishing
            if (t.getStatut() == StatutTache.IN_PROGRESS && progressPercent >= 75) {
                long tempsRestant = ChronoUnit.MINUTES.between(now, deadline);
                alertes.add(AlerteDTO.builder()
                        .niveau(progressPercent >= 90 ? "CRITIQUE" : "WARNING")
                        .projetNom(projetNom)
                        .projetId(projetId)
                        .tacheNom(t.getTitre())
                        .tacheId(t.getId())
                        .employeNom(employeNom)
                        .managerNom(managerNom)
                        .probleme("Tâche en cours depuis longtemps — " + Math.round(progressPercent)
                                + "% du temps écoulé, il reste " + formatDuration(tempsRestant))
                        .actionSuggere("Vérifier l'avancement avec l'employé ou ajouter du support")
                        .retardJours(0)
                        .dateDetection(now)
                        .build());
            }
        }

        // Manager assignment alerts: projects created > 12h ago with unassigned tasks
        for (Projet p : projets) {
            if (p.getStatut() == StatutProjet.ANNULE || p.getStatut() == StatutProjet.CLOTURE || p.getStatut() == StatutProjet.CLOTURE_INCOMPLET) continue;
            if (p.getDateCreation() == null) continue;

            long hoursSinceCreation = ChronoUnit.HOURS.between(p.getDateCreation(), now);
            if (hoursSinceCreation >= MANAGER_ASSIGN_THRESHOLD_HOURS) {
                List<Tache> projetTaches = taches.stream()
                        .filter(t -> t.getProjet() != null && t.getProjet().getId().equals(p.getId()))
                        .collect(Collectors.toList());

                long unassigned = projetTaches.stream().filter(t -> t.getAssignee() == null).count();
                if (unassigned > 0) {
                    String manNom = null;
                    try {
                        if (p.getChefDeProjet() != null) {
                            manNom = p.getChefDeProjet().getPrenom() + " " + p.getChefDeProjet().getNom();
                        }
                    } catch (Exception ignored) {}

                    alertes.add(AlerteDTO.builder()
                            .niveau("WARNING")
                            .projetNom(p.getNom())
                            .projetId(p.getId())
                            .tacheNom(null)
                            .tacheId(null)
                            .employeNom(null)
                            .managerNom(manNom)
                            .probleme(unassigned + " tâche(s) non assignée(s) depuis " + hoursSinceCreation + "h")
                            .actionSuggere("Le manager doit assigner les tâches aux membres de l'équipe")
                            .retardJours(0)
                            .dateDetection(now)
                            .build());
                }
            }
        }

        // Sort: CRITIQUE first, then WARNING, then INFO
        alertes.sort((a, b) -> {
            int scoreA = "CRITIQUE".equals(a.getNiveau()) ? 0 : "WARNING".equals(a.getNiveau()) ? 1 : 2;
            int scoreB = "CRITIQUE".equals(b.getNiveau()) ? 0 : "WARNING".equals(b.getNiveau()) ? 1 : 2;
            return Integer.compare(scoreA, scoreB);
        });

        return alertes;
    }

    private List<AlerteDTO> generateAlertesForProjet(Projet projet, List<Tache> taches) {
        return generateAlertes(List.of(projet), taches);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private boolean isTacheEnRetard(Tache tache) {
        if (tache.getDateEcheance() == null) return false;
        if (tache.getStatut() == StatutTache.DONE) {
            return tache.getDateFinExecution() != null
                    && tache.getDateFinExecution().toLocalDate().isAfter(tache.getDateEcheance());
        }
        return LocalDate.now().isAfter(tache.getDateEcheance());
    }

    private String getStatutRetard(Tache tache) {
        if (tache.getDateEcheance() == null) return "DANS_LES_TEMPS";

        if (tache.getStatut() == StatutTache.DONE) {
            if (tache.getDateFinExecution() != null
                    && tache.getDateFinExecution().toLocalDate().isAfter(tache.getDateEcheance())) {
                return "EN_RETARD";
            }
            return "DANS_LES_TEMPS";
        }

        // Not done checks
        LocalDate now = LocalDate.now();
        if (now.isAfter(tache.getDateEcheance())) return "CRITIQUE";

        long daysLeft = ChronoUnit.DAYS.between(now, tache.getDateEcheance());
        if (daysLeft <= 1) return "EN_RETARD";
        return "DANS_LES_TEMPS";
    }

    private String formatDuration(long minutes) {
        if (minutes < 60) return minutes + " min";
        long hours = minutes / 60;
        long mins = minutes % 60;
        if (hours < 24) return hours + "h" + (mins > 0 ? mins + "min" : "");
        long days = hours / 24;
        long remainHours = hours % 24;
        return days + "j " + (remainHours > 0 ? remainHours + "h" : "");
    }
}
