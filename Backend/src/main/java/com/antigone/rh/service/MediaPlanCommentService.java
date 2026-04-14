package com.antigone.rh.service;

import com.antigone.rh.dto.MediaPlanCommentDTO;
import com.antigone.rh.dto.MediaPlanCommentRequest;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.MediaPlanComment;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.MediaPlanCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MediaPlanCommentService {

    private final MediaPlanCommentRepository commentRepository;
    private final EmployeRepository employeRepository;

    @Transactional
    public MediaPlanCommentDTO create(MediaPlanCommentRequest req) {
        Employe auteur = employeRepository.findById(req.getAuteurId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé: " + req.getAuteurId()));

        MediaPlanComment comment = MediaPlanComment.builder()
                .mediaPlanId(req.getMediaPlanId())
                .draftKey(req.getDraftKey())
                .columnKey(req.getColumnKey())
                .content(req.getContent())
                .clientId(req.getClientId())
                .monthKey(req.getMonthKey())
                .auteur(auteur)
                .build();

        comment = commentRepository.save(comment);
        return toDTO(comment);
    }

    public List<MediaPlanCommentDTO> getByMediaPlanId(Long mediaPlanId) {
        return commentRepository.findByMediaPlanId(mediaPlanId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MediaPlanCommentDTO> getByMediaPlanIds(List<Long> ids) {
        return commentRepository.findByMediaPlanIdIn(ids).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MediaPlanCommentDTO> getByDraftKey(String draftKey) {
        return commentRepository.findByDraftKey(draftKey).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MediaPlanCommentDTO> getByClientIdAndMonthKey(Long clientId, String monthKey) {
        return commentRepository.findByClientIdAndMonthKey(clientId, monthKey).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        commentRepository.deleteById(id);
    }

    private MediaPlanCommentDTO toDTO(MediaPlanComment c) {
        MediaPlanCommentDTO dto = new MediaPlanCommentDTO();
        dto.setId(c.getId());
        dto.setMediaPlanId(c.getMediaPlanId());
        dto.setDraftKey(c.getDraftKey());
        dto.setColumnKey(c.getColumnKey());
        dto.setContent(c.getContent());
        dto.setAuteurId(c.getAuteur().getId());
        dto.setAuteurNom(c.getAuteur().getNom());
        dto.setAuteurPrenom(c.getAuteur().getPrenom());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
