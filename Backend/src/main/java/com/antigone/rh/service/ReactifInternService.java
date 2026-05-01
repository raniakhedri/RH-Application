package com.antigone.rh.service;

import com.antigone.rh.dto.ReactifInternDTO;
import com.antigone.rh.entity.*;
import com.antigone.rh.enums.StatutTache;
import com.antigone.rh.enums.TypeReactif;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReactifInternService {

    private final ReactifInternRepository reactifRepository;
    private final TacheRepository tacheRepository;
    private final MediaPlanRepository mediaPlanRepository;
    private final EmployeRepository employeRepository;
    private final ClientRepository clientRepository;

    @PostConstruct
    public void fixExistingData() {
        List<ReactifIntern> all = reactifRepository.findAll();
        boolean changed = false;
        for (ReactifIntern r : all) {
            if (r.getType() == TypeReactif.TACHE && r.getDateTermineOriginal() == null) {
                // Approximate completion date with reactif time for old records
                r.setDateTermineOriginal(r.getDateReactif());
                changed = true;
            }
        }
        if (changed) {
            reactifRepository.saveAll(all);
        }
    }

    // ─── Create: Tache Reactif ────────────────────────────────────────────────
    public ReactifInternDTO createForTache(Long tacheId, Long managerId, String contenu) {
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée: " + tacheId));
        Employe manager = employeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager non trouvé: " + managerId));

        // Count existing reactifs for this tache
        long count = reactifRepository.countByTache_Id(tacheId);

        ReactifIntern reactif = ReactifIntern.builder()
                .type(TypeReactif.TACHE)
                .contenu(contenu)
                .tache(tache)
                .manager(manager)
                .employe(tache.getAssignee())
                .nombreFois((int) (count + 1))
                .dateReactif(LocalDateTime.now())
                .dateTermineOriginal(tache.getDateFinExecution())
                .build();
        reactif = reactifRepository.save(reactif);

        // Reset task to TODO & unarchive
        tache.setStatut(StatutTache.TODO);
        tache.setArchived(false);
        tache.setDateFinExecution(null);
        tacheRepository.save(tache);

        return toDTO(reactif);
    }

    // ─── Create: Media Plan Intern Reactif (manager decline) ─────────────────
    public ReactifInternDTO createForMediaPlanIntern(Long mediaPlanId, Long managerId, String contenu) {
        MediaPlan mp = mediaPlanRepository.findById(mediaPlanId)
                .orElseThrow(() -> new RuntimeException("Media Plan non trouvé: " + mediaPlanId));
        Employe manager = employeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager non trouvé: " + managerId));

        long count = reactifRepository.countByMediaPlan_Id(mediaPlanId);

        ReactifIntern reactif = ReactifIntern.builder()
                .type(TypeReactif.MEDIA_PLAN_INTERN)
                .contenu(contenu)
                .mediaPlan(mp)
                .manager(manager)
                .employe(mp.getCreateur())
                .client(mp.getClient())
                .nombreFois((int) (count + 1))
                .dateReactif(LocalDateTime.now())
                .build();

        return toDTO(reactifRepository.save(reactif));
    }

    // ─── Create: Client (Extern) Reactif ─────────────────────────────────────
    public ReactifInternDTO createForMediaPlanExtern(Long mediaPlanId, Long clientId, String contenu) {
        MediaPlan mp = mediaPlanRepository.findById(mediaPlanId)
                .orElseThrow(() -> new RuntimeException("Media Plan non trouvé: " + mediaPlanId));
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        // Count only EXTERN reactifs for this mediaplan
        long count = reactifRepository.findByMediaPlan_IdOrderByDateReactifDesc(mediaPlanId)
                .stream().filter(r -> r.getType() == TypeReactif.MEDIA_PLAN_EXTERN).count();

        ReactifIntern reactif = ReactifIntern.builder()
                .type(TypeReactif.MEDIA_PLAN_EXTERN)
                .contenu(contenu)
                .mediaPlan(mp)
                .client(client)
                .employe(mp.getCreateur())
                .nombreFois((int) (count + 1))
                .dateReactif(LocalDateTime.now())
                .build();

        return toDTO(reactifRepository.save(reactif));
    }

    // ─── Queries ─────────────────────────────────────────────────────────────
    public List<ReactifInternDTO> getAllTacheReactifs() {
        return reactifRepository.findAllTacheReactifs().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ReactifInternDTO> getAllMediaPlanInternReactifs() {
        return reactifRepository.findAllMediaPlanInternReactifs().stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReactifInternDTO> getAllMediaPlanExternReactifs() {
        return reactifRepository.findAllMediaPlanExternReactifs().stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReactifInternDTO> getByTache(Long tacheId) {
        return reactifRepository.findByTache_IdOrderByDateReactifDesc(tacheId).stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReactifInternDTO> getByMediaPlan(Long mediaPlanId) {
        return reactifRepository.findByMediaPlan_IdOrderByDateReactifDesc(mediaPlanId).stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────
    private ReactifInternDTO toDTO(ReactifIntern r) {
        ReactifInternDTO.ReactifInternDTOBuilder b = ReactifInternDTO.builder()
                .id(r.getId())
                .type(r.getType())
                .contenu(r.getContenu())
                .dateReactif(r.getDateReactif())
                .nombreFois(r.getNombreFois());

        if (r.getTache() != null) {
            Tache t = r.getTache();
            b.tacheId(t.getId())
                    .tacheTitre(t.getTitre())
                    .tacheDescription(t.getDescription())
                    .tacheDateEcheance(t.getDateEcheance())
                    .tacheDateFinExecution(
                            r.getDateTermineOriginal() != null ? r.getDateTermineOriginal() : t.getDateFinExecution());
            if (t.getDateCreation() != null) {
                b.tacheDateCreation(t.getDateCreation().toLocalDate());
            }
            if (t.getProjet() != null) {
                Projet p = t.getProjet();
                b.projetId(p.getId()).projetNom(p.getNom());
                // Client via projet
                if (p.getClient() != null) {
                    b.clientId(p.getClient().getId()).clientNom(p.getClient().getNom());
                }
            }
        }

        if (r.getMediaPlan() != null) {
            MediaPlan mp = r.getMediaPlan();
            b.mediaPlanId(mp.getId())
                    .mediaPlanTitre(mp.getTitre())
                    .mediaPlanDateCreation(mp.getDateCreation());
            if (mp.getDatePublication() != null) {
                b.mediaPlanMois(mp.getDatePublication().toString().substring(0, 7)); // yyyy-MM
            }
            if (mp.getClient() != null) {
                b.clientId(mp.getClient().getId()).clientNom(mp.getClient().getNom());
            }
        }

        if (r.getManager() != null) {
            b.managerId(r.getManager().getId())
                    .managerNom(r.getManager().getNom())
                    .managerPrenom(r.getManager().getPrenom());
        }

        if (r.getEmploye() != null) {
            b.employeId(r.getEmploye().getId())
                    .employeNom(r.getEmploye().getNom())
                    .employePrenom(r.getEmploye().getPrenom());
        }

        if (r.getClient() != null) {
            b.clientId(r.getClient().getId()).clientNom(r.getClient().getNom());
        }

        return b.build();
    }
}
