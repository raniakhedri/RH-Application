package com.antigone.rh.controller;

import com.antigone.rh.dto.*;
import com.antigone.rh.enums.TypeJour;
import com.antigone.rh.service.CalendrierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendrier")
@RequiredArgsConstructor
public class CalendrierController {

    private final CalendrierService calendrierService;

    // =============================================
    // JOURS (FÉRIÉS / SPÉCIAUX)
    // =============================================

    @GetMapping("/jours")
    public ResponseEntity<ApiResponse<List<CalendrierDTO>>> getAllJours() {
        return ResponseEntity.ok(ApiResponse.ok(calendrierService.getAllJours()));
    }

    @GetMapping("/jours/{id}")
    public ResponseEntity<ApiResponse<CalendrierDTO>> getJourById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(calendrierService.getJourById(id)));
    }

    @GetMapping("/jours/type/{typeJour}")
    public ResponseEntity<ApiResponse<List<CalendrierDTO>>> getJoursByType(@PathVariable TypeJour typeJour) {
        return ResponseEntity.ok(ApiResponse.ok(calendrierService.getJoursByType(typeJour)));
    }

    @GetMapping("/jours/periode")
    public ResponseEntity<ApiResponse<List<CalendrierDTO>>> getJoursByPeriode(
            @RequestParam String debut, @RequestParam String fin) {
        return ResponseEntity.ok(ApiResponse.ok(
                calendrierService.getJoursByPeriode(LocalDate.parse(debut), LocalDate.parse(fin))));
    }

    @GetMapping("/jours/feries/{annee}")
    public ResponseEntity<ApiResponse<List<CalendrierDTO>>> getFeries(@PathVariable Integer annee) {
        return ResponseEntity.ok(ApiResponse.ok(calendrierService.getFeries(annee)));
    }

    @PostMapping("/jours")
    public ResponseEntity<ApiResponse<CalendrierDTO>> createJour(@RequestBody CalendrierRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Jour ajouté avec succès", calendrierService.createJour(request)));
    }

    @PutMapping("/jours/{id}")
    public ResponseEntity<ApiResponse<CalendrierDTO>> updateJour(
            @PathVariable Long id, @RequestBody CalendrierRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Jour modifié avec succès", calendrierService.updateJour(id, request)));
    }

    @DeleteMapping("/jours/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteJour(@PathVariable Long id) {
        calendrierService.deleteJour(id);
        return ResponseEntity.ok(ApiResponse.ok("Jour supprimé avec succès", null));
    }

    // =============================================
    // HORAIRES DE TRAVAIL
    // =============================================

    @GetMapping("/horaires")
    public ResponseEntity<ApiResponse<List<HoraireTravailDTO>>> getAllHoraires() {
        return ResponseEntity.ok(ApiResponse.ok(calendrierService.getAllHoraires()));
    }

    @GetMapping("/horaires/{id}")
    public ResponseEntity<ApiResponse<HoraireTravailDTO>> getHoraireById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(calendrierService.getHoraireById(id)));
    }

    @PostMapping("/horaires")
    public ResponseEntity<ApiResponse<HoraireTravailDTO>> createHoraire(@RequestBody HoraireTravailRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Horaire créé avec succès", calendrierService.createHoraire(request)));
    }

    @PutMapping("/horaires/{id}")
    public ResponseEntity<ApiResponse<HoraireTravailDTO>> updateHoraire(
            @PathVariable Long id, @RequestBody HoraireTravailRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Horaire modifié avec succès", calendrierService.updateHoraire(id, request)));
    }

    @DeleteMapping("/horaires/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHoraire(@PathVariable Long id) {
        calendrierService.deleteHoraire(id);
        return ResponseEntity.ok(ApiResponse.ok("Horaire supprimé avec succès", null));
    }
}
