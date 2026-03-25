package com.antigone.rh.service;

import com.antigone.rh.dto.PermissionDTO;
import com.antigone.rh.dto.RoleDTO;
import com.antigone.rh.dto.RoleRequest;
import com.antigone.rh.entity.Permission;
import com.antigone.rh.entity.Role;
import com.antigone.rh.repository.PermissionRepository;
import com.antigone.rh.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    private static final Map<String, String> PERMISSION_LABELS = Map.ofEntries(
            Map.entry("VIEW_DASHBOARD", "Tableau de bord"),
            Map.entry("VIEW_EMPLOYES", "Employés"),
            Map.entry("VIEW_DEMANDES", "Demandes"),
            Map.entry("VIEW_VALIDATIONS", "Validations"),
            Map.entry("VIEW_PROJETS", "Projets"),
            Map.entry("VIEW_EQUIPES", "Équipes"),
            Map.entry("VIEW_TACHES", "Tâches"),
            Map.entry("VIEW_REFERENTIELS", "Référentiels"),
            Map.entry("VIEW_CALENDRIER", "Calendrier Entreprise"),
            Map.entry("VIEW_COMPTES", "Comptes"),
            Map.entry("VIEW_ROLES", "Rôles"),
            Map.entry("VIEW_MONITORING", "Monitoring"),
            Map.entry("VIEW_TOUS_PROJETS", "Tous les projets"),
            Map.entry("VIEW_DASHBOARD_RH", "Dashboard RH"),
            Map.entry("VIEW_MES_DEMANDES", "Mes demandes"),
            Map.entry("VIEW_MES_PROJETS", "Mes projets"),
            Map.entry("VIEW_MON_CALENDRIER", "Mon calendrier"));

    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public RoleDTO getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));
        return toDTO(role);
    }

    public RoleDTO createRole(RoleRequest request) {
        if (roleRepository.findByNom(request.getNom()).isPresent()) {
            throw new RuntimeException("Un rôle avec ce nom existe déjà");
        }

        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissionIds() != null) {
            permissions = new HashSet<>(permissionRepository.findAllById(request.getPermissionIds()));
        }

        Role role = Role.builder()
                .nom(request.getNom())
                .permissions(permissions)
                .build();

        return toDTO(roleRepository.save(role));
    }

    public RoleDTO updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        role.setNom(request.getNom());

        if (request.getPermissionIds() != null) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(request.getPermissionIds()));
            role.setPermissions(permissions);
        }

        return toDTO(roleRepository.save(role));
    }

    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        if (!role.getComptes().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer ce rôle car il est assigné à des comptes");
        }

        roleRepository.delete(role);
    }

    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::toPermissionDTO)
                .collect(Collectors.toList());
    }

    public void initPermissions() {
        for (Map.Entry<String, String> entry : PERMISSION_LABELS.entrySet()) {
            if (permissionRepository.findByPermission(entry.getKey()).isEmpty()) {
                permissionRepository.save(Permission.builder()
                        .permission(entry.getKey())
                        .build());
            }
        }
        // Supprimer les permissions obsolètes qui ne sont plus dans PERMISSION_LABELS
        permissionRepository.findAll().stream()
                .filter(p -> !PERMISSION_LABELS.containsKey(p.getPermission()))
                .forEach(p -> {
                    p.getRoles().forEach(role -> role.getPermissions().remove(p));
                    permissionRepository.delete(p);
                });
    }

    public RoleDTO toDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .nom(role.getNom())
                .permissions(role.getPermissions().stream()
                        .map(this::toPermissionDTO)
                        .collect(Collectors.toSet()))
                .build();
    }

    private PermissionDTO toPermissionDTO(Permission permission) {
        return PermissionDTO.builder()
                .id(permission.getId())
                .permission(permission.getPermission())
                .label(PERMISSION_LABELS.getOrDefault(permission.getPermission(), permission.getPermission()))
                .build();
    }
}
