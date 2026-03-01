package com.antigone.rh.service;

import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.repository.EmployeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeService {

    private final EmployeRepository employeRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

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
        // Auto-generate matricule from département (3 first letters + 4 random digits)
        employe.setMatricule(generateMatricule(dto.getDepartement()));
        if (dto.getManagerId() != null) {
            Employe manager = employeRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
            employe.setManager(manager);
        }
        return toDTO(employeRepository.save(employe));
    }

    /**
     * Génère un matricule unique : 3 premières lettres du département + 4 chiffres aléatoires.
     * Le matricule sert aussi de login pour se connecter.
     */
    private String generateMatricule(String departement) {
        String prefix;
        if (departement != null && !departement.isEmpty()) {
            String cleaned = departement.toUpperCase().replaceAll("[^A-Z]", "");
            if (cleaned.length() >= 3) {
                prefix = cleaned.substring(0, 3);
            } else {
                prefix = String.format("%-3s", cleaned).replace(' ', 'X');
            }
        } else {
            prefix = "EMP";
        }

        String matricule;
        do {
            int number = 1000 + RANDOM.nextInt(9000); // 4 chiffres
            matricule = prefix + number;
        } while (employeRepository.existsByMatricule(matricule));

        return matricule;
    }

    public EmployeDTO update(Long id, EmployeDTO dto) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'id: " + id));
        // Le matricule ne change pas (généré automatiquement)
        employe.setCin(dto.getCin());
        employe.setCnss(dto.getCnss());
        employe.setNom(dto.getNom());
        employe.setPrenom(dto.getPrenom());
        employe.setEmail(dto.getEmail());
        employe.setTelephone(dto.getTelephone());
        employe.setDateEmbauche(dto.getDateEmbauche());
        employe.setSoldeConge(dto.getSoldeConge());
        employe.setPoste(dto.getPoste());
        employe.setTypeContrat(dto.getTypeContrat());
        employe.setGenre(dto.getGenre() != null ? com.antigone.rh.enums.Genre.valueOf(dto.getGenre()) : null);
        employe.setDepartement(dto.getDepartement());
        employe.setRibBancaire(dto.getRibBancaire());
        employe.setImageUrl(dto.getImageUrl());
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

    public EmployeDTO updateImage(Long id, String imageUrl) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));
        employe.setImageUrl(imageUrl);
        return toDTO(employeRepository.save(employe));
    }

    public EmployeDTO toDTO(Employe employe) {
        return EmployeDTO.builder()
                .id(employe.getId())
                .matricule(employe.getMatricule())
                .cin(employe.getCin())
                .cnss(employe.getCnss())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .telephone(employe.getTelephone())
                .dateEmbauche(employe.getDateEmbauche())
                .soldeConge(employe.getSoldeConge())
                .poste(employe.getPoste())
                .typeContrat(employe.getTypeContrat())
                .genre(employe.getGenre() != null ? employe.getGenre().name() : null)
                .departement(employe.getDepartement())
                .ribBancaire(employe.getRibBancaire())
                .managerId(employe.getManager() != null ? employe.getManager().getId() : null)
                .managerNom(employe.getManager() != null ? employe.getManager().getNom() + " " + employe.getManager().getPrenom() : null)
                .imageUrl(employe.getImageUrl())
                .build();
    }

    private Employe toEntity(EmployeDTO dto) {
        return Employe.builder()
                .matricule(dto.getMatricule())
                .cin(dto.getCin())
                .cnss(dto.getCnss())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .telephone(dto.getTelephone())
                .dateEmbauche(dto.getDateEmbauche())
                .soldeConge(dto.getSoldeConge() != null ? dto.getSoldeConge() : 30.0)
                .poste(dto.getPoste())
                .typeContrat(dto.getTypeContrat())
                .genre(dto.getGenre() != null ? com.antigone.rh.enums.Genre.valueOf(dto.getGenre()) : null)
                .departement(dto.getDepartement())
                .ribBancaire(dto.getRibBancaire())
                .imageUrl(dto.getImageUrl())
                .build();
    }
}
