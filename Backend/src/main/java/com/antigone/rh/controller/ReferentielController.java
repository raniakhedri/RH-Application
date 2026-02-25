package com.antigone.rh.controller;

import com.antigone.rh.dto.*;
import com.antigone.rh.service.ReferentielService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/referentiels")
@RequiredArgsConstructor
public class ReferentielController {

    private final ReferentielService referentielService;

    // =============================================
    // TYPE REFERENTIEL (ENUM) ENDPOINTS
    // =============================================

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getAllTypes() {
        return ResponseEntity.ok(ApiResponse.ok(referentielService.getAllTypes()));
    }

    // =============================================
    // REFERENTIEL ENDPOINTS
    // =============================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReferentielDTO>>> getAllReferentiels() {
        return ResponseEntity.ok(ApiResponse.ok(referentielService.getAllReferentiels()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReferentielDTO>> getReferentielById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(referentielService.getReferentielById(id)));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<ReferentielDTO>>> getReferentielsByType(@PathVariable String type) {
        return ResponseEntity.ok(ApiResponse.ok(referentielService.getReferentielsByType(type)));
    }

    @GetMapping("/type/{type}/actifs")
    public ResponseEntity<ApiResponse<List<ReferentielDTO>>> getActiveReferentielsByType(@PathVariable String type) {
        return ResponseEntity.ok(ApiResponse.ok(referentielService.getActiveReferentielsByType(type)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReferentielDTO>> createReferentiel(@RequestBody ReferentielRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Référentiel créé avec succès", referentielService.createReferentiel(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReferentielDTO>> updateReferentiel(
            @PathVariable Long id, @RequestBody ReferentielRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Référentiel modifié avec succès", referentielService.updateReferentiel(id, request)));
    }

    @PatchMapping("/{id}/toggle-actif")
    public ResponseEntity<ApiResponse<ReferentielDTO>> toggleActif(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Statut modifié avec succès", referentielService.toggleActif(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReferentiel(@PathVariable Long id) {
        referentielService.deleteReferentiel(id);
        return ResponseEntity.ok(ApiResponse.ok("Référentiel supprimé avec succès", null));
    }
}
