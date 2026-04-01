package com.antigone.rh.service;

import com.antigone.rh.dto.TacheObligatoireDTO;
import com.antigone.rh.dto.TacheObligatoireRequest;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Equipe;
import com.antigone.rh.entity.TacheObligatoire;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.EquipeRepository;
import com.antigone.rh.repository.TacheObligatoireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TacheObligatoireService {

        private final TacheObligatoireRepository tacheObligatoireRepository;
        private final EquipeRepository equipeRepository;
        private final EmployeRepository employeRepository;

        public TacheObligatoireDTO create(TacheObligatoireRequest request) {
                Equipe equipe = null;
                if (request.getEquipeId() != null) {
                        equipe = equipeRepository.findById(request.getEquipeId())
                                        .orElse(null);
                }

                Employe employe = null;
                if (request.getEmployeId() != null) {
                        employe = employeRepository.findById(request.getEmployeId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Employé non trouvé: " + request.getEmployeId()));
                }

                String datesStr = request.getDates() != null
                                ? String.join(",", request.getDates())
                                : "";

                TacheObligatoire tache = TacheObligatoire.builder()
                                .nom(request.getNom())
                                .dates(datesStr)
                                .equipe(equipe)
                                .employe(employe)
                                .build();

                return toDTO(tacheObligatoireRepository.save(tache));
        }

        @Transactional(readOnly = true)
        public List<TacheObligatoireDTO> findAll() {
                return tacheObligatoireRepository.findAll().stream()
                                .map(this::toDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<TacheObligatoireDTO> findByEmploye(Long employeId) {
                return tacheObligatoireRepository.findByEmployeDirectOrViaEquipe(employeId).stream()
                                .map(this::toDTO)
                                .collect(Collectors.toList());
        }

        public void delete(Long id) {
                tacheObligatoireRepository.deleteById(id);
        }

        private TacheObligatoireDTO toDTO(TacheObligatoire t) {
                List<String> datesList = (t.getDates() != null && !t.getDates().isBlank())
                                ? Arrays.stream(t.getDates().split(","))
                                                .map(String::trim)
                                                .filter(s -> !s.isEmpty())
                                                .collect(Collectors.toList())
                                : List.of();

                return TacheObligatoireDTO.builder()
                                .id(t.getId())
                                .nom(t.getNom())
                                .dates(datesList)
                                .equipeId(t.getEquipe() != null ? t.getEquipe().getId() : null)
                                .equipeNom(t.getEquipe() != null ? t.getEquipe().getNom() : null)
                                .employeId(t.getEmploye() != null ? t.getEmploye().getId() : null)
                                .employeNom(t.getEmploye() != null
                                                ? t.getEmploye().getPrenom() + " " + t.getEmploye().getNom()
                                                : null)
                                .build();
        }
}
