package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.entity.Equipe;
import com.antigone.rh.service.EquipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipes")
@RequiredArgsConstructor
public class EquipeController {

    private final EquipeService equipeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Equipe>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Equipe>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findById(id)));
    }

    @GetMapping("/projet/{projetId}")
    public ResponseEntity<ApiResponse<List<Equipe>>> getByProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findByProjet(projetId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Equipe>> create(@RequestParam Long projetId, @RequestParam String nom) {
        return ResponseEntity.ok(ApiResponse.ok("Équipe créée", equipeService.create(projetId, nom)));
    }

    @PostMapping("/{id}/membres/{employeId}")
    public ResponseEntity<ApiResponse<Equipe>> addMembre(@PathVariable Long id, @PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok("Membre ajouté", equipeService.addMembre(id, employeId)));
    }

    @DeleteMapping("/{id}/membres/{employeId}")
    public ResponseEntity<ApiResponse<Equipe>> removeMembre(@PathVariable Long id, @PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok("Membre retiré", equipeService.removeMembre(id, employeId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        equipeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Équipe supprimée", null));
    }
}
