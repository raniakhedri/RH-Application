package com.antigone.rh.config;

import com.antigone.rh.entity.Permission;
import com.antigone.rh.entity.Role;
import com.antigone.rh.repository.PermissionRepository;
import com.antigone.rh.repository.RoleRepository;
import com.antigone.rh.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleService roleService;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {
        log.info("Initialisation des permissions...");
        roleService.initPermissions();
        log.info("Permissions initialisées avec succès");

        // Créer le rôle ADMIN avec toutes les permissions s'il n'existe pas
        if (roleRepository.findByNom("ADMIN").isEmpty()) {
            List<Permission> allPermissions = permissionRepository.findAll();
            Role adminRole = Role.builder()
                    .nom("ADMIN")
                    .permissions(new HashSet<>(allPermissions))
                    .build();
            roleRepository.save(adminRole);
            log.info("Rôle ADMIN créé avec toutes les permissions ({})", allPermissions.size());
        } else {
            // Mettre à jour le rôle ADMIN existant pour s'assurer qu'il a toutes les permissions
            Role adminRole = roleRepository.findByNom("ADMIN").get();
            List<Permission> allPermissions = permissionRepository.findAll();
            adminRole.setPermissions(new HashSet<>(allPermissions));
            roleRepository.save(adminRole);
            log.info("Rôle ADMIN mis à jour avec toutes les permissions ({})", allPermissions.size());
        }
    }
}
