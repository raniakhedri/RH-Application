package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.EquipeCreateRequest;
import com.antigone.rh.dto.EquipeDTO;
import com.antigone.rh.dto.EmployeDTO;
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
    public ResponseEntity<ApiResponse<List<EquipeDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipeDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findById(id)));
    }

    @GetMapping("/projet/{projetId}")
    public ResponseEntity<ApiResponse<List<EquipeDTO>>> getByProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findByProjet(projetId)));
    }

    @GetMapping("/projet/{projetId}/membres")
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> getMembresByProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(ApiResponse.ok(equipeService.findMembresByProjet(projetId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EquipeDTO>> create(@RequestBody EquipeCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Équipe créée", equipeService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipeDTO>> update(@PathVariable Long id,
            @RequestBody EquipeCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Équipe mise à jour", equipeService.update(id, request)));
    }

    @PostMapping("/{id}/membres/{employeId}")
    public ResponseEntity<ApiResponse<EquipeDTO>> addMembre(@PathVariable Long id, @PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok("Membre ajouté", equipeService.addMembre(id, employeId)));
    }

    @DeleteMapping("/{id}/membres/{employeId}")
    public ResponseEntity<ApiResponse<EquipeDTO>> removeMembre(@PathVariable Long id, @PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok("Membre retiré", equipeService.removeMembre(id, employeId)));
    }

    @PatchMapping("/{id}/projet/{projetId}")
    public ResponseEntity<ApiResponse<EquipeDTO>> assignToProjet(@PathVariable Long id, @PathVariable Long projetId) {
        return ResponseEntity
                .ok(ApiResponse.ok("Équipe assignée au projet", equipeService.assignToProjet(id, projetId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        equipeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Équipe supprimée", null));
    }
}
