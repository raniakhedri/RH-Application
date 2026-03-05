package com.antigone.rh.service;

import com.antigone.rh.dto.*;
import com.antigone.rh.entity.*;
import com.antigone.rh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CompteService {

    private final CompteRepository compteRepository;
    private final EmployeRepository employeRepository;
    private final RoleRepository roleRepository;
    private final AccessLogRepository accessLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RoleService roleService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%";

    // ─── Login ───────────────────────────────────────────────────
    public LoginResponse login(LoginRequest request, String ipAddress) {
        Compte compte = compteRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Identifiants invalides"));

        if (!passwordEncoder.matches(request.getPassword(), compte.getPasswordHash())) {
            logAccess(compte, ipAddress, "CONNEXION_ECHOUEE");
            throw new RuntimeException("Identifiants invalides");
        }

        if (!compte.getEnabled()) {
            throw new RuntimeException("Compte désactivé");
        }

        compte.setLastLogin(LocalDateTime.now());
        compteRepository.save(compte);

        logAccess(compte, ipAddress, "CONNEXION");

        Employe employe = compte.getEmploye();
        Set<String> roles = compte.getRoles().stream()
                .map(Role::getNom)
                .collect(Collectors.toSet());

        Set<String> permissions = compte.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getPermission)
                .collect(Collectors.toSet());

        return LoginResponse.builder()
                .compteId(compte.getId())
                .employeId(employe.getId())
                .username(compte.getUsername())
                .nom(employe.getNom())
                .prenom(employe.getPrenom())
                .email(employe.getEmail())
                .roles(roles)
                .permissions(permissions)
                .mustChangePassword(compte.getMustChangePassword())
                .genre(employe.getGenre() != null ? employe.getGenre().name() : null)
                .message("Connexion réussie")
                .imageUrl(employe.getImageUrl())
                .build();
    }

    // ─── CRUD Comptes ────────────────────────────────────────────
    public List<CompteDTO> getAllComptes() {
        return compteRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CompteDTO getCompteById(Long id) {
        Compte compte = compteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));
        return toDTO(compte);
    }

    public CompteDTO createCompte(CompteRequest request) {
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        // Check if employee already has an account
        if (compteRepository.findByEmployeId(employe.getId()).isPresent()) {
            throw new RuntimeException("Cet employé a déjà un compte");
        }

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        // Le matricule de l'employé est utilisé comme login
        String username = employe.getMatricule();

        // Auto-generate password
        String rawPassword = generatePassword(10);

        Compte compte = Compte.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .enabled(true)
                .mustChangePassword(true)
                .employe(employe)
                .roles(new HashSet<>(Set.of(role)))
                .build();

        Compte saved = compteRepository.save(compte);

        // Send email with credentials
        emailService.sendCredentials(
                employe.getEmail(),
                employe.getNom() + " " + employe.getPrenom(),
                username,
                rawPassword
        );

        log.info("Compte créé pour {} : username={}", employe.getNom(), username);

        CompteDTO dto = toDTO(saved);
        dto.setGeneratedPassword(rawPassword); // Return password only on creation
        return dto;
    }

    public CompteDTO updateCompte(Long id, CompteRequest request) {
        Compte compte = compteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));

        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));
            compte.getRoles().clear();
            compte.getRoles().add(role);
        }

        return toDTO(compteRepository.save(compte));
    }

    public CompteDTO toggleEnabled(Long id) {
        Compte compte = compteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));
        compte.setEnabled(!compte.getEnabled());
        return toDTO(compteRepository.save(compte));
    }

    // ─── Change Password ─────────────────────────────────────────
    public void changePassword(Long compteId, ChangePasswordRequest request) {
        Compte compte = compteRepository.findById(compteId)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));

        if (!passwordEncoder.matches(request.getOldPassword(), compte.getPasswordHash())) {
            throw new RuntimeException("Ancien mot de passe incorrect");
        }

        compte.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        compte.setMustChangePassword(false);
        compteRepository.save(compte);
    }

    // ─── Access Logs ─────────────────────────────────────────────
    public List<AccessLogDTO> getAccessLogs(Long compteId) {
        return accessLogRepository.findByCompteIdOrderByDateAccesDesc(compteId).stream()
                .map(this::toAccessLogDTO)
                .collect(Collectors.toList());
    }

    private void logAccess(Compte compte, String ipAddress, String action) {
        AccessLog logEntry = AccessLog.builder()
                .compte(compte)
                .adresseIp(ipAddress)
                .action(action)
                .build();
        accessLogRepository.save(logEntry);
    }

    // ─── Password Generation ────────────────────────────────────
    private String generatePassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    // ─── Mappers ─────────────────────────────────────────────────
    private CompteDTO toDTO(Compte compte) {
        Employe employe = compte.getEmploye();
        return CompteDTO.builder()
                .id(compte.getId())
                .username(compte.getUsername())
                .enabled(compte.getEnabled())
                .mustChangePassword(compte.getMustChangePassword())
                .lastLogin(compte.getLastLogin())
                .createdAt(compte.getCreatedAt())
                .employeId(employe.getId())
                .employeNom(employe.getNom())
                .employePrenom(employe.getPrenom())
                .employeEmail(employe.getEmail())
                .employePoste(employe.getPoste())
                .roles(compte.getRoles().stream()
                        .map(roleService::toDTO)
                        .collect(Collectors.toSet()))
                .build();
    }

    private AccessLogDTO toAccessLogDTO(AccessLog logEntry) {
        return AccessLogDTO.builder()
                .id(logEntry.getId())
                .compteId(logEntry.getCompte().getId())
                .username(logEntry.getCompte().getUsername())
                .dateAcces(logEntry.getDateAcces())
                .adresseIp(logEntry.getAdresseIp())
                .action(logEntry.getAction())
                .build();
    }
}
