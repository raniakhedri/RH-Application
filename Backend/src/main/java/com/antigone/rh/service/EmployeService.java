package com.antigone.rh.service;

import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.enums.Sexe;
import com.antigone.rh.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeService {

    private final EmployeRepository employeRepository;

    public List<EmployeDTO> findAll() {
        return employeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeDTO findById(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        return toDTO(employe);
    }

    public EmployeDTO findByMatricule(String matricule) {
        Employe employe = employeRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec le matricule: " + matricule));
        return toDTO(employe);
    }

    public EmployeDTO findByEmail(String email) {
        Employe employe = employeRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'email: " + email));
        return toDTO(employe);
    }

    public List<EmployeDTO> findSubordinates(Long managerId) {
        return employeRepository.findByManagerId(managerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeDTO create(EmployeDTO dto) {
        Employe employe = toEntity(dto);
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        }
        return toDTO(employeRepository.save(employe));
    }

    public EmployeDTO update(Long id, EmployeDTO dto) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        employe.setMatricule(dto.getMatricule());
        employe.setCin(dto.getCin());
        employe.setNom(dto.getNom());
        employe.setPrenom(dto.getPrenom());
        employe.setEmail(dto.getEmail());
        employe.setTelephone(dto.getTelephone());
        employe.setDateEmbauche(dto.getDateEmbauche());
        employe.setSoldeConge(dto.getSoldeConge());
        if (dto.getSexe() != null) {
            employe.setSexe(Sexe.valueOf(dto.getSexe()));
        } else {
            employe.setSexe(null);
        }
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        } else {
            employe.setManager(null);
        }
        return toDTO(employeRepository.save(employe));
    }

    public void delete(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new RuntimeException("Employé non trouvé avec l'id: " + id);
        }
        employeRepository.deleteById(id);
    }

    public void updateSoldeConge(Long id, Double solde) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        employe.setSoldeConge(solde);
        employeRepository.save(employe);
    }

    public EmployeDTO toDTO(Employe employe) {
        return EmployeDTO.builder()
                .id(employe.getId())
                .matricule(employe.getMatricule())
                .cin(employe.getCin())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .telephone(employe.getTelephone())
                .dateEmbauche(employe.getDateEmbauche())
                .soldeConge(employe.getSoldeConge())
                .sexe(employe.getSexe() != null ? employe.getSexe().name() : null)
                .managerId(employe.getManager() != null ? employe.getManager().getId() : null)
                .managerNom(employe.getManager() != null ? employe.getManager().getNom() + " " + employe.getManager().getPrenom() : null)
                .build();
    }

    private Employe toEntity(EmployeDTO dto) {
        return Employe.builder()
                .matricule(dto.getMatricule())
                .cin(dto.getCin())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .dateEmbauche(dto.getDateEmbauche())
                .soldeConge(dto.getSoldeConge() != null ? dto.getSoldeConge() : 0.0)
                .sexe(dto.getSexe() != null ? Sexe.valueOf(dto.getSexe()) : null)
                .build();
    }
}
