package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.DemandeRequest;
import com.antigone.rh.dto.DemandeResponse;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.service.DemandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DemandeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findById(id)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findByEmploye(employeId)));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> getByStatut(@PathVariable StatutDemande statut) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findByStatut(statut)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DemandeResponse>> create(@RequestBody DemandeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Demande créée", demandeService.create(request)));
    }

    @PatchMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<DemandeResponse>> submit(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Demande soumise", demandeService.submit(id)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<DemandeResponse>> cancel(
            @PathVariable Long id,
            @RequestBody(required = false) DemandeRequest request) {
        String motif = request != null ? request.getMotifAnnulation() : null;
        return ResponseEntity.ok(ApiResponse.ok("Demande annulée", demandeService.cancel(id, motif)));
    }
}
