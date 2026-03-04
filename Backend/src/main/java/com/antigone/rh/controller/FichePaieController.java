package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.FichePaieDTO;
import com.antigone.rh.service.FichePaieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fiches-paie")
@RequiredArgsConstructor
public class FichePaieController {

    private final FichePaieService fichePaieService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FichePaieDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(fichePaieService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FichePaieDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(fichePaieService.findById(id)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<FichePaieDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(fichePaieService.findByEmploye(employeId)));
    }

    @GetMapping("/mois")
    public ResponseEntity<ApiResponse<List<FichePaieDTO>>> getByMoisAndAnnee(
            @RequestParam int mois, @RequestParam int annee) {
        return ResponseEntity.ok(ApiResponse.ok(fichePaieService.findByMoisAndAnnee(mois, annee)));
    }

    /**
     * POST /api/fiches-paie/generer?mois=6&annee=2025
     * Génère les fiches de paie pour un mois donné
     */
    @PostMapping("/generer")
    public ResponseEntity<ApiResponse<List<FichePaieDTO>>> generer(
            @RequestParam int mois, @RequestParam int annee) {
        return ResponseEntity.ok(ApiResponse.ok("Fiches de paie générées",
                fichePaieService.genererFichesPaieMensuelles(mois, annee)));
    }

    /**
     * POST /api/fiches-paie/{id}/generer-employe?mois=6&annee=2025
     */
    @PostMapping("/generer-employe")
    public ResponseEntity<ApiResponse<FichePaieDTO>> genererPourEmploye(
            @RequestParam Long employeId, @RequestParam int mois, @RequestParam int annee) {
        return ResponseEntity.ok(ApiResponse.ok("Fiche de paie générée",
                fichePaieService.genererFichePaie(employeId, mois, annee)));
    }

    /**
     * PUT /api/fiches-paie/{id}/valider?adminEmployeId=1
     */
    @PutMapping("/{id}/valider")
    public ResponseEntity<ApiResponse<FichePaieDTO>> valider(
            @PathVariable Long id, @RequestParam Long adminEmployeId) {
        return ResponseEntity.ok(ApiResponse.ok("Fiche de paie validée",
                fichePaieService.validerFichePaie(id, adminEmployeId)));
    }
}
