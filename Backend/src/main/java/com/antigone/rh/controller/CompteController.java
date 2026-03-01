package com.antigone.rh.controller;

import com.antigone.rh.dto.*;
import com.antigone.rh.service.CompteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comptes")
@RequiredArgsConstructor
public class CompteController {

    private final CompteService compteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompteDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Liste des comptes", compteService.getAllComptes()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompteDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Compte trouvé", compteService.getCompteById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompteDTO>> create(@RequestBody CompteRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Compte créé avec succès", compteService.createCompte(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompteDTO>> update(@PathVariable Long id, @RequestBody CompteRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Compte modifié avec succès", compteService.updateCompte(id, request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<CompteDTO>> toggleEnabled(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Statut modifié", compteService.toggleEnabled(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {
        try {
            compteService.changePassword(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Mot de passe modifié avec succès", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<List<AccessLogDTO>>> getAccessLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Logs d'accès", compteService.getAccessLogs(id)));
    }
}
