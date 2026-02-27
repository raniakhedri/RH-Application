package com.antigone.rh.service;

import com.antigone.rh.dto.LoginRequest;
import com.antigone.rh.dto.LoginResponse;
import com.antigone.rh.entity.Compte;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Role;
import com.antigone.rh.repository.CompteRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CompteService {

    private final CompteRepository compteRepository;
    private final EmployeRepository employeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        Compte compte = compteRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Identifiants invalides"));

        if (!passwordEncoder.matches(request.getPassword(), compte.getPasswordHash())) {
            throw new RuntimeException("Identifiants invalides");
        }

        if (!compte.getEnabled()) {
            throw new RuntimeException("Compte désactivé");
        }

        Employe employe = compte.getEmploye();
        Set<String> roles = compte.getRoles().stream()
                .map(Role::getNom)
                .collect(Collectors.toSet());

        return LoginResponse.builder()
                .employeId(employe.getId())
                .username(compte.getUsername())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .roles(roles)
                .sexe(employe.getSexe() != null ? employe.getSexe().name() : null)
                .message("Connexion réussie")
                .build();
    }

    public Compte createCompte(Long employeId, String username, String password, String roleName) {
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        if (compteRepository.existsByUsername(username)) {
            throw new RuntimeException("Ce nom d'utilisateur existe déjà");
        }

        Role role = roleRepository.findByNom(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder().nom(roleName).build()));

        Compte compte = Compte.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .enabled(true)
                .employe(employe)
                .roles(Set.of(role))
                .build();

        return compteRepository.save(compte);
    }

    public void disableCompte(Long compteId) {
        Compte compte = compteRepository.findById(compteId)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));
        compte.setEnabled(false);
        compteRepository.save(compte);
    }

    public void enableCompte(Long compteId) {
        Compte compte = compteRepository.findById(compteId)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));
        compte.setEnabled(true);
        compteRepository.save(compte);
    }
}
