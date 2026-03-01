package com.antigone.rh.controller;

import com.antigone.rh.dto.*;
import com.antigone.rh.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Liste des rôles", roleService.getAllRoles()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Rôle trouvé", roleService.getRoleById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleDTO>> create(@RequestBody RoleRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Rôle créé avec succès", roleService.createRole(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDTO>> update(@PathVariable Long id, @RequestBody RoleRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Rôle modifié avec succès", roleService.updateRole(id, request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.ok(ApiResponse.ok("Rôle supprimé avec succès", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<PermissionDTO>>> getAllPermissions() {
        return ResponseEntity.ok(ApiResponse.ok("Liste des permissions", roleService.getAllPermissions()));
    }
}
