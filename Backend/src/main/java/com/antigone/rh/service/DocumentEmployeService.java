package com.antigone.rh.service;

import com.antigone.rh.dto.DocumentEmployeDTO;
import com.antigone.rh.entity.DocumentEmploye;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.repository.DocumentEmployeRepository;
import com.antigone.rh.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentEmployeService {

    private final DocumentEmployeRepository documentRepository;
    private final EmployeRepository employeRepository;
    private final NotificationService notificationService;

    public List<DocumentEmployeDTO> findByEmployeId(Long employeId) {
        return documentRepository.findByEmployeId(employeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DocumentEmployeDTO> findExpiringSoon(int days) {
        LocalDate now = LocalDate.now();
        return documentRepository.findByDateExpirationBetween(now, now.plusDays(days)).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DocumentEmployeDTO> findExpired() {
        return documentRepository.findByDateExpirationBefore(LocalDate.now()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DocumentEmployeDTO create(DocumentEmployeDTO dto) {
        Employe employe = employeRepository.findById(dto.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        DocumentEmploye doc = DocumentEmploye.builder()
                .nom(dto.getNom())
                .type(dto.getType())
                .fichierUrl(dto.getFichierUrl())
                .dateExpiration(dto.getDateExpiration())
                .employe(employe)
                .build();
        DocumentEmployeDTO saved = toDTO(documentRepository.save(doc));

        notificationService.create(employe,
                "Nouveau document ajouté",
                "Le document \"" + dto.getNom() + "\" (" + dto.getType() + ") a été ajouté à votre dossier."
                + (dto.getDateExpiration() != null ? " Date d'expiration : " + dto.getDateExpiration() + "." : ""),
                null);

        // Warn if document expires soon (within 30 days)
        if (dto.getDateExpiration() != null && dto.getDateExpiration().isBefore(LocalDate.now().plusDays(30))) {
            notificationService.create(employe,
                    "Document bientôt expiré",
                    "Attention : le document \"" + dto.getNom() + "\" expire le " + dto.getDateExpiration() + ". Veuillez le renouveler.",
                    null);
        }

        return saved;
    }

    public DocumentEmployeDTO update(Long id, DocumentEmployeDTO dto) {
        DocumentEmploye doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));
        doc.setNom(dto.getNom());
        doc.setType(dto.getType());
        doc.setDateExpiration(dto.getDateExpiration());
        if (dto.getFichierUrl() != null) {
            doc.setFichierUrl(dto.getFichierUrl());
        }
        DocumentEmployeDTO saved = toDTO(documentRepository.save(doc));

        notificationService.create(doc.getEmploye(),
                "Document mis à jour",
                "Le document \"" + dto.getNom() + "\" a été modifié dans votre dossier."
                + (dto.getDateExpiration() != null ? " Nouvelle date d'expiration : " + dto.getDateExpiration() + "." : ""),
                null);

        return saved;
    }

    public DocumentEmployeDTO updateFichier(Long id, String fichierUrl) {
        DocumentEmploye doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));
        doc.setFichierUrl(fichierUrl);
        return toDTO(documentRepository.save(doc));
    }

    public void delete(Long id) {
        DocumentEmploye doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));

        notificationService.create(doc.getEmploye(),
                "Document supprimé",
                "Le document \"" + doc.getNom() + "\" a été retiré de votre dossier.",
                null);

        documentRepository.deleteById(id);
    }

    private DocumentEmployeDTO toDTO(DocumentEmploye doc) {
        return DocumentEmployeDTO.builder()
                .id(doc.getId())
                .nom(doc.getNom())
                .type(doc.getType())
                .fichierUrl(doc.getFichierUrl())
                .dateExpiration(doc.getDateExpiration())
                .employeId(doc.getEmploye().getId())
                .employeNom(doc.getEmploye().getNom() + " " + doc.getEmploye().getPrenom())
                .build();
    }
}
