package com.antigone.rh.service;

import com.antigone.rh.dto.*;
import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.exception.ResourceNotFoundException;
import com.antigone.rh.repository.ReferentielRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReferentielService {

    private final ReferentielRepository referentielRepository;

    // =============================================
    // TYPE REFERENTIEL (ENUM) OPERATIONS
    // =============================================

    public List<Map<String, String>> getAllTypes() {
        return Arrays.stream(TypeReferentiel.values())
                .map(t -> Map.of("code", t.name(), "label", t.getLabel()))
                .collect(Collectors.toList());
    }

    // =============================================
    // REFERENTIEL OPERATIONS
    // =============================================

    public List<ReferentielDTO> getAllReferentiels() {
        return referentielRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReferentielDTO> getReferentielsByType(String type) {
        TypeReferentiel typeRef = TypeReferentiel.valueOf(type);
        return referentielRepository.findByTypeReferentiel(typeRef).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReferentielDTO> getActiveReferentielsByType(String type) {
        TypeReferentiel typeRef = TypeReferentiel.valueOf(type);
        return referentielRepository.findByTypeReferentielAndActifTrue(typeRef).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ReferentielDTO getReferentielById(Long id) {
        Referentiel ref = referentielRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Referentiel", id));
        return toDTO(ref);
    }

    public ReferentielDTO createReferentiel(ReferentielRequest request) {
        TypeReferentiel typeRef = TypeReferentiel.valueOf(request.getTypeReferentiel());

        if (referentielRepository.existsByLibelleAndTypeReferentiel(request.getLibelle(), typeRef)) {
            throw new RuntimeException("Un référentiel avec le libellé '" + request.getLibelle()
                    + "' existe déjà dans ce type");
        }

        Referentiel ref = Referentiel.builder()
                .libelle(request.getLibelle())
                .description(request.getDescription())
                .actif(true)
                .typeReferentiel(typeRef)
                .valeur(request.getValeur())
                .build();

        return toDTO(referentielRepository.save(ref));
    }

    public ReferentielDTO updateReferentiel(Long id, ReferentielRequest request) {
        Referentiel ref = referentielRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Referentiel", id));

        TypeReferentiel typeRef = TypeReferentiel.valueOf(request.getTypeReferentiel());

        if ((!ref.getLibelle().equals(request.getLibelle())
                || !ref.getTypeReferentiel().equals(typeRef))
                && referentielRepository.existsByLibelleAndTypeReferentiel(request.getLibelle(), typeRef)) {
            throw new RuntimeException("Un référentiel avec le libellé '" + request.getLibelle()
                    + "' existe déjà dans ce type");
        }

        ref.setLibelle(request.getLibelle());
        ref.setDescription(request.getDescription());
        ref.setTypeReferentiel(typeRef);
        ref.setValeur(request.getValeur());

        return toDTO(referentielRepository.save(ref));
    }

    public ReferentielDTO toggleActif(Long id) {
        Referentiel ref = referentielRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Referentiel", id));

        ref.setActif(!ref.getActif());
        return toDTO(referentielRepository.save(ref));
    }

    public void deleteReferentiel(Long id) {
        if (!referentielRepository.existsById(id)) {
            throw new ResourceNotFoundException("Referentiel", id);
        }
        referentielRepository.deleteById(id);
    }

    // =============================================
    // MAPPER
    // =============================================

    private ReferentielDTO toDTO(Referentiel ref) {
        return ReferentielDTO.builder()
                .id(ref.getId())
                .libelle(ref.getLibelle())
                .description(ref.getDescription())
                .actif(ref.getActif())
                .typeReferentiel(ref.getTypeReferentiel().name())
                .typeReferentielLabel(ref.getTypeReferentiel().getLabel())
                .valeur(ref.getValeur())
                .build();
    }
}
