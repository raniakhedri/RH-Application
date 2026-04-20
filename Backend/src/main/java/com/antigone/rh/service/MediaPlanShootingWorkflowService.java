package com.antigone.rh.service;

import com.antigone.rh.dto.ProjetDTO;
import com.antigone.rh.dto.ProjetRequest;
import com.antigone.rh.entity.CalendrierProjet;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.MediaPlan;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.entity.Tache;
import com.antigone.rh.enums.StatutMediaPlan;
import com.antigone.rh.enums.StatutShooting;
import com.antigone.rh.enums.StatutTache;
import com.antigone.rh.repository.CalendrierProjetRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.MediaPlanRepository;
import com.antigone.rh.repository.ProjetRepository;
import com.antigone.rh.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class MediaPlanShootingWorkflowService {

    private final CalendrierProjetRepository calendrierProjetRepository;
    private final EmployeRepository employeRepository;
    private final MediaPlanRepository mediaPlanRepository;
    private final NotificationService notificationService;
    private final ProjetService projetService;
    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;

    public void onMediaPlanApproved(MediaPlan mp) {
        if (mp == null || !mp.isShooting()) {
            return;
        }

        validateShootingFields(mp);

        Employe headProd = findHeadProdOrThrow();

        CalendrierProjet slot = calendrierProjetRepository.findByMediaPlanLigneId(mp.getId()).orElse(null);
        Long ignoreSlotId = slot != null ? slot.getId() : null;

        ensureDateAvailable(headProd.getId(), mp.getShootingDate(), ignoreSlotId);

        if (slot == null) {
            slot = new CalendrierProjet();
        }

        slot.setDateSlot(mp.getShootingDate());
        slot.setManager(headProd);
        slot.setSocialManager(mp.getCreateur());
        slot.setProjectName(buildProjectName(mp));
        slot.setDescription(mp.getShootingDescription());
        slot.setLocalisation(mp.getShootingLocalisation());
        slot.setTypeDeContenu(mp.getShootingTypeDeContenu());
        slot.setUrgent(false);
        slot.setType(CalendrierProjet.SlotType.BOOKED);
        slot.setStatut(CalendrierProjet.SlotStatus.EN_ATTENTE);
        slot.setMediaPlanLigne(mp);

        slot = calendrierProjetRepository.save(slot);

        // Keep in-memory back reference for immediate DTO mapping
        mp.setCalendrierProjet(slot);
        mp.setShootingStatus(StatutShooting.EN_ATTENTE);
        mp.setShootingStatusReason(null);
        mediaPlanRepository.save(mp);

        // Notify head prod to validate
        String creatorName = mp.getCreateur() != null
                ? ((nullToEmpty(mp.getCreateur().getPrenom()) + " " + nullToEmpty(mp.getCreateur().getNom())).trim())
                : "Un Social Media Manager";
        String message = creatorName + " a planifié un shooting '" + nullToEmpty(mp.getTitre()) + "' le "
                + mp.getShootingDate() + ". Veuillez valider.";
        notificationService.create(headProd, "PLANIFICATION_PROJET", message, null);
    }

    public void onCalendrierSlotStatusUpdated(CalendrierProjet slot) {
        if (slot == null || slot.getMediaPlanLigne() == null) {
            return;
        }

        MediaPlan mp = slot.getMediaPlanLigne();

        if (slot.getStatut() == CalendrierProjet.SlotStatus.VALIDE) {
            mp.setShootingStatus(StatutShooting.VALIDE);
            mp.setShootingStatusReason(null);
            createShootingProjectIfMissing(mp, slot);
        } else if (slot.getStatut() == CalendrierProjet.SlotStatus.REJETE) {
            mp.setShootingStatus(StatutShooting.REJETE);
            mp.setShootingStatusReason("Date de shooting n'est pas validé");

            // Head Prod refusal should behave like a disapproval in manager views.
            // This mirrors the existing MediaPlan disapprove behavior.
            mp.setStatut(StatutMediaPlan.DESAPPROUVE);
        } else if (slot.getStatut() == CalendrierProjet.SlotStatus.EN_ATTENTE) {
            mp.setShootingStatus(StatutShooting.EN_ATTENTE);
            mp.setShootingStatusReason(null);
        }

        mediaPlanRepository.save(mp);
    }

    private void validateShootingFields(MediaPlan mp) {
        if (mp.getShootingDate() == null) {
            throw new RuntimeException("Date de shooting obligatoire");
        }
        if (mp.getShootingTypeDeContenu() == null) {
            throw new RuntimeException("Type de contenu shooting obligatoire");
        }
    }

    private Employe findHeadProdOrThrow() {
        List<Employe> managers1 = employeRepository.findByRoleName("Head Prod");
        List<Employe> managers2 = employeRepository.findByRoleName("HEAD_PROD");

        List<Employe> merged = Stream.concat(managers1.stream(), managers2.stream())
                .collect(Collectors.toMap(Employe::getId, e -> e, (a, b) -> a))
                .values().stream().collect(Collectors.toList());

        if (merged.isEmpty()) {
            throw new RuntimeException("Aucun Head Prod trouvé pour planifier le shooting");
        }

        return merged.get(0);
    }

    private void ensureDateAvailable(Long managerId, LocalDate date, Long ignoreSlotId) {
        if (managerId == null || date == null) {
            return;
        }

        List<CalendrierProjet.SlotStatus> blocking = List.of(
                CalendrierProjet.SlotStatus.EN_ATTENTE,
                CalendrierProjet.SlotStatus.VALIDE
        );

        List<CalendrierProjet> conflicts = calendrierProjetRepository
                .findByManagerIdAndDateSlotBetweenAndStatutIn(managerId, date, date, blocking);

        boolean hasOther = conflicts.stream().anyMatch(s -> ignoreSlotId == null || !s.getId().equals(ignoreSlotId));
        if (hasOther) {
            throw new RuntimeException("Date de shooting indisponible");
        }
    }

    private String buildProjectName(MediaPlan mp) {
        return "📸 Shooting: " + (mp.getTitre() != null ? mp.getTitre() : "Sans titre");
    }

    private void createShootingProjectIfMissing(MediaPlan mp, CalendrierProjet slot) {
        if (mp.getId() == null) {
            return;
        }

        Optional<Projet> existing = projetRepository.findFirstByMediaPlanLigneId(mp.getId());
        if (existing.isPresent()) {
            return;
        }

        ProjetRequest projetReq = new ProjetRequest();
        projetReq.setNom("👉 Shooting: " + (mp.getTitre() != null ? mp.getTitre() : "Sans titre"));
        projetReq.setDateDebut(slot.getDateSlot() != null ? slot.getDateSlot() : LocalDate.now());
        projetReq.setTypeProjet("INDETERMINE");
        projetReq.setIsMediaPlanProject(true);
        projetReq.setMediaPlanLigneId(mp.getId());
        if (mp.getClient() != null) {
            projetReq.setClientId(mp.getClient().getId());
        }

        Employe chef = slot.getManager() != null ? slot.getManager() : null;
        if (chef != null) {
            projetReq.setChefDeProjetIds(List.of(chef.getId()));
            projetReq.setCreateurId(chef.getId());
        }

        ProjetDTO pDTO = projetService.create(projetReq);
        Projet createdProjet = projetRepository.findById(pDTO.getId()).orElse(null);
        if (createdProjet == null) {
            return;
        }

        String base = mp.getTitre() != null ? mp.getTitre() : "Shooting";
        String[] taskNames = {
                "Shooting - " + base,
                "Post-production - " + base,
                "Validation & Publication - " + base
        };

        for (String tName : taskNames) {
            Tache t = new Tache();
            t.setTitre(tName);
            t.setStatut(StatutTache.TODO);
            t.setProjet(createdProjet);
            t.setUrgente(false);
            tacheRepository.save(t);
        }
    }

    private String nullToEmpty(String v) {
        return v == null ? "" : v;
    }
}
