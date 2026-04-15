package com.antigone.rh.service;

import com.antigone.rh.dto.MediaPlanDTO;
import com.antigone.rh.dto.MediaPlanRequest;
import com.antigone.rh.dto.ProjetRequest;
import com.antigone.rh.entity.Client;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.MediaPlan;
import com.antigone.rh.entity.MediaPlanAssignment;
import com.antigone.rh.enums.EtatPublication;
import com.antigone.rh.enums.StatutMediaPlan;
import com.antigone.rh.exception.ResourceNotFoundException;
import com.antigone.rh.repository.ClientRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.MediaPlanAssignmentRepository;
import com.antigone.rh.repository.MediaPlanRepository;
import com.antigone.rh.repository.ProjetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MediaPlanService {

    private final MediaPlanRepository mediaPlanRepository;
    private final MediaPlanAssignmentRepository assignmentRepository;
    private final ClientRepository clientRepository;
    private final EmployeRepository employeRepository;
    private final ProjetService projetService;
    private final ProjetRepository projetRepository;
    private final com.antigone.rh.repository.TacheRepository tacheRepository;
    private final GoogleDriveService googleDriveService;

    // =============================================
    // QUERIES
    // =============================================

    public List<MediaPlanDTO> findAll() {
        return mediaPlanRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public MediaPlanDTO findById(Long id) {
        MediaPlan mp = mediaPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MediaPlan", id));
        return toDTO(mp);
    }

    public List<MediaPlanDTO> findByClientId(Long clientId) {
        return mediaPlanRepository.findByClientId(clientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Find media plans for clients assigned to the given employee.
     */
    public List<MediaPlanDTO> findByAssignedEmploye(Long employeId) {
        List<MediaPlanAssignment> assignments = assignmentRepository.findByEmployeId(employeId);
        if (assignments.isEmpty()) {
            return List.of();
        }
        List<Long> clientIds = assignments.stream()
                .map(a -> a.getClient().getId())
                .collect(Collectors.toList());
        return mediaPlanRepository.findByClientIdIn(clientIds).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // =============================================
    // CREATE / UPDATE / DELETE
    // =============================================

    public MediaPlanDTO create(MediaPlanRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", request.getClientId()));
        Employe createur = employeRepository.findById(request.getCreateurId())
                .orElseThrow(() -> new ResourceNotFoundException("Employe", request.getCreateurId()));

        MediaPlan mp = MediaPlan.builder()
                .datePublication(
                        request.getDatePublication() != null ? LocalDate.parse(request.getDatePublication()) : null)
                .heure(request.getHeure())
                .format(request.getFormat())
                .type(request.getType())
                .titre(request.getTitre())
                .texteSurVisuel(request.getTexteSurVisuel())
                .inspiration(request.getInspiration())
                .autresElements(request.getAutresElements())
                .platforme(request.getPlatforme())
                .lienDrive(request.getLienDrive())
                .etatPublication(request.getEtatPublication() != null
                        ? EtatPublication.valueOf(request.getEtatPublication())
                        : EtatPublication.PAS_ENCORE)
                .rectifs(request.getRectifs())
                .remarques(request.getRemarques())
                .statut(StatutMediaPlan.EN_ATTENTE)
                .client(client)
                .createur(createur)
                .build();

        return toDTO(mediaPlanRepository.save(mp));
    }

    public List<MediaPlanDTO> createBulk(List<MediaPlanRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        String driveLink = null;
        try {
            // Get client name for folder naming
            Long firstClientId = requests.get(0).getClientId();
            if (firstClientId == null) {
                throw new RuntimeException("ClientId manquant pour le premier media plan du lot");
            }
            Client client = clientRepository.findById(firstClientId).orElse(null);
            String clientName = client != null ? client.getNom() : "Inconnu";

            // Use the publication date of the first item to determine the month folder
            // (fall back to today if no date provided)
            LocalDate folderDate = LocalDate.now();
            String firstDatePub = requests.get(0).getDatePublication();
            if (firstDatePub != null && !firstDatePub.isBlank()) {
                try {
                    folderDate = LocalDate.parse(firstDatePub);
                } catch (Exception ignored) {
                    log.warn("Could not parse datePublication '{}', using today for folder name.", firstDatePub);
                }
            }

            // Create or reuse: [parent] / [clientName] / [Month Year]
            driveLink = googleDriveService.getOrCreateClientMonthFolder(clientName, folderDate);
        } catch (IOException e) {
            log.error("Failed to create Google Drive folder: {}", e.getMessage());
            throw new RuntimeException("Erreur Google Drive: " + e.getMessage());
        }

        List<MediaPlan> savedPlans = new ArrayList<>();
        for (MediaPlanRequest req : requests) {
            Client client = clientRepository.findById(req.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", req.getClientId()));
            Employe createur = employeRepository.findById(req.getCreateurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employe", req.getCreateurId()));

            // Parse date Publication safely
            LocalDate datePub = null;
            if (req.getDatePublication() != null && !req.getDatePublication().isBlank()) {
                try {
                    datePub = LocalDate.parse(req.getDatePublication());
                } catch (Exception e) {
                    throw new RuntimeException("Format de date invalide pour '"
                            + (req.getTitre() != null ? req.getTitre() : "ligne sans titre") + "': "
                            + req.getDatePublication());
                }
            }

            // Parse EtatPublication safely
            EtatPublication etatPub = EtatPublication.PAS_ENCORE;
            if (req.getEtatPublication() != null && !req.getEtatPublication().isBlank()) {
                try {
                    etatPub = EtatPublication.valueOf(req.getEtatPublication());
                } catch (IllegalArgumentException e) {
                    log.warn("Unknown EtatPublication value: {}, falling back to PAS_ENCORE", req.getEtatPublication());
                }
            }

            MediaPlan mp = MediaPlan.builder()
                    .datePublication(datePub)
                    .heure(req.getHeure())
                    .format(req.getFormat())
                    .type(req.getType())
                    .titre(req.getTitre() != null ? req.getTitre() : "Sans titre")
                    .texteSurVisuel(req.getTexteSurVisuel())
                    .inspiration(req.getInspiration())
                    .autresElements(req.getAutresElements())
                    .platforme(req.getPlatforme())
                    .lienDrive(driveLink != null ? driveLink : req.getLienDrive())
                    .etatPublication(etatPub)
                    .rectifs(req.getRectifs())
                    .remarques(req.getRemarques())
                    .statut(StatutMediaPlan.EN_ATTENTE)
                    .client(client)
                    .createur(createur)
                    .build();

            try {
                savedPlans.add(mediaPlanRepository.save(mp));
            } catch (Exception e) {
                log.error("Failed to save media plan row: {}", e.getMessage(), e);
                throw new RuntimeException("Erreur lors de la sauvegarde d'une ligne du media plan: " + e.getMessage());
            }
        }

        return savedPlans.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public MediaPlanDTO update(Long id, MediaPlanRequest request) {
        MediaPlan mp = mediaPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MediaPlan", id));

        if (request.getDatePublication() != null) {
            mp.setDatePublication(LocalDate.parse(request.getDatePublication()));
        }
        if (request.getHeure() != null)
            mp.setHeure(request.getHeure());
        if (request.getFormat() != null)
            mp.setFormat(request.getFormat());
        if (request.getType() != null)
            mp.setType(request.getType());
        if (request.getTitre() != null)
            mp.setTitre(request.getTitre());
        if (request.getTexteSurVisuel() != null)
            mp.setTexteSurVisuel(request.getTexteSurVisuel());
        if (request.getInspiration() != null)
            mp.setInspiration(request.getInspiration());
        if (request.getAutresElements() != null)
            mp.setAutresElements(request.getAutresElements());
        if (request.getPlatforme() != null)
            mp.setPlatforme(request.getPlatforme());
        if (request.getLienDrive() != null)
            mp.setLienDrive(request.getLienDrive());
        if (request.getEtatPublication() != null) {
            mp.setEtatPublication(EtatPublication.valueOf(request.getEtatPublication()));
        }
        if (request.getRectifs() != null)
            mp.setRectifs(request.getRectifs());
        if (request.getRemarques() != null)
            mp.setRemarques(request.getRemarques());

        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", request.getClientId()));
            mp.setClient(client);
        }

        return toDTO(mediaPlanRepository.save(mp));
    }

    public void delete(Long id) {
        if (!mediaPlanRepository.existsById(id)) {
            throw new ResourceNotFoundException("MediaPlan", id);
        }
        mediaPlanRepository.deleteById(id);
    }

    // =============================================
    // APPROVAL WORKFLOW
    // =============================================

    /**
     * Approve a media plan:
     * 1. Set status = APPROUVE
     * 2. Auto-create a Projet
     * 3. Add approving manager + department-based managers as chefs de projet
     */
    public MediaPlanDTO approve(Long mediaPlanId, Long managerId) {
        MediaPlan mp = mediaPlanRepository.findById(mediaPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("MediaPlan", mediaPlanId));

        mp.setStatut(StatutMediaPlan.APPROUVE);
        mediaPlanRepository.save(mp);

        // Check if format contains "Video" (case insensitive)
        if (mp.getFormat() != null && mp.getFormat().toLowerCase().contains("video")) {
            String projetNom = "👉 Mediaplan: " + (mp.getTitre() != null ? mp.getTitre() : "Sans titre");

            ProjetRequest projetReq = new ProjetRequest();
            projetReq.setNom(projetNom);
            projetReq.setDateDebut(LocalDate.now());
            projetReq.setTypeProjet("INDETERMINE");
            projetReq.setStatut("PLANIFIE");
            projetReq.setIsMediaPlanProject(true);
            projetReq.setMediaPlanLigneId(mp.getId());

            Long clientId = mp.getClient() != null ? mp.getClient().getId() : null;
            if (clientId != null) {
                projetReq.setClientId(clientId);
            }

            // Build chef de projet list
            List<Long> chefIds = new ArrayList<>();
            chefIds.add(managerId); // the approving manager

            // Add manager from department based on format
            Long departmentManagerId = findManagerByFormat(mp.getFormat());
            if (departmentManagerId != null && !chefIds.contains(departmentManagerId)) {
                chefIds.add(departmentManagerId);
            }

            projetReq.setChefDeProjetIds(chefIds);
            projetReq.setCreateurId(managerId);

            com.antigone.rh.dto.ProjetDTO pDTO = projetService.create(projetReq);

            // Auto-create default tasks
            com.antigone.rh.entity.Projet createdProjet = projetRepository.findById(pDTO.getId()).orElse(null);
            if (createdProjet != null) {
                String[] taskNames = {
                        "Tournage - " + (mp.getTitre() != null ? mp.getTitre() : "Vidéo"),
                        "Montage - " + (mp.getTitre() != null ? mp.getTitre() : "Vidéo"),
                        "Validation & Publication - " + (mp.getTitre() != null ? mp.getTitre() : "Vidéo")
                };
                for (String tName : taskNames) {
                    com.antigone.rh.entity.Tache t = new com.antigone.rh.entity.Tache();
                    t.setTitre(tName);
                    t.setStatut(com.antigone.rh.enums.StatutTache.TODO);
                    t.setProjet(createdProjet);
                    t.setUrgente(false);
                    tacheRepository.save(t);
                }
            }
        }

        return toDTO(mp);
    }

    public MediaPlanDTO disapprove(Long mediaPlanId) {
        MediaPlan mp = mediaPlanRepository.findById(mediaPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("MediaPlan", mediaPlanId));
        mp.setStatut(StatutMediaPlan.DESAPPROUVE);
        return toDTO(mediaPlanRepository.save(mp));
    }

    // ── Google Drive Auth Bridges ────────────────────────────────────────────
    public String getGoogleAuthUrl() throws IOException {
        return googleDriveService.getAuthorizationUrl();
    }

    public void storeGoogleToken(String code) throws IOException {
        // This is a bit simplified, usually we'd need another step to exchange code for
        // token
        // But GoogleAuthorizationCodeFlow handled by AuthorizationCodeInstalledApp does
        // it.
        // I'll need to manually implement the exchange if I want it purely backend.
        // For now, I'll update GoogleDriveService to handle the exchange.
        googleDriveService.exchangeCodeForToken(code);
    }

    public boolean isGoogleAuthorized() {
        return googleDriveService.isAuthorized();
    }

    // =============================================
    // HELPERS
    // =============================================

    /**
     * Find a manager from the department that matches the media plan format:
     * - Reel/Video → department containing "prod" (Production)
     * - Carrousel → department containing "design"
     * - Story → department containing "social media"
     */
    private Long findManagerByFormat(String format) {
        if (format == null)
            return null;

        String departmentKeyword;
        switch (format.toLowerCase()) {
            case "reel":
            case "video":
                departmentKeyword = "prod";
                break;
            case "carrousel":
                departmentKeyword = "design";
                break;
            case "story":
                departmentKeyword = "social media";
                break;
            default:
                return null;
        }

        // Find employees in the matching department whose role includes management
        List<Employe> allEmployees = employeRepository.findAll();
        return allEmployees.stream()
                .filter(e -> e.getDepartement() != null
                        && e.getDepartement().toLowerCase().contains(departmentKeyword))
                .filter(e -> e.getManager() == null || e.getSubordonnes() != null && !e.getSubordonnes().isEmpty())
                .map(Employe::getId)
                .findFirst()
                .orElse(null);
    }

    // =============================================
    // MAPPER
    // =============================================

    private MediaPlanDTO toDTO(MediaPlan mp) {
        return MediaPlanDTO.builder()
                .id(mp.getId())
                .datePublication(mp.getDatePublication() != null ? mp.getDatePublication().toString() : null)
                .heure(mp.getHeure())
                .format(mp.getFormat())
                .type(mp.getType())
                .titre(mp.getTitre())
                .texteSurVisuel(mp.getTexteSurVisuel())
                .inspiration(mp.getInspiration())
                .autresElements(mp.getAutresElements())
                .platforme(mp.getPlatforme())
                .lienDrive(mp.getLienDrive())
                .etatPublication(mp.getEtatPublication() != null ? mp.getEtatPublication().name() : null)
                .rectifs(mp.getRectifs())
                .remarques(mp.getRemarques())
                .statut(mp.getStatut().name())
                .clientId(mp.getClient() != null ? mp.getClient().getId() : null)
                .clientNom(mp.getClient() != null ? mp.getClient().getNom() : null)
                .createurId(mp.getCreateur() != null ? mp.getCreateur().getId() : null)
                .createurNom(mp.getCreateur() != null ? mp.getCreateur().getNom() : null)
                .createurPrenom(mp.getCreateur() != null ? mp.getCreateur().getPrenom() : null)
                .dateCreation(mp.getDateCreation() != null ? mp.getDateCreation().toString() : null)
                .build();
    }
}
