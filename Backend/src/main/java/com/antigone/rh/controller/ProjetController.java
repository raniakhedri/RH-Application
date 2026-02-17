package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.entity.Projet;
import com.antigone.rh.enums.StatutProjet;
import com.antigone.rh.service.ProjetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
public class ProjetController {

    private final ProjetService projetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Projet>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(projetService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Projet>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(projetService.findById(id)));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<ApiResponse<List<Projet>>> getByStatut(@PathVariable StatutProjet statut) {
        return ResponseEntity.ok(ApiResponse.ok(projetService.findByStatut(statut)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Projet>> create(@RequestBody Projet projet) {
        return ResponseEntity.ok(ApiResponse.ok("Projet créé", projetService.create(projet)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Projet>> update(@PathVariable Long id, @RequestBody Projet projet) {
        return ResponseEntity.ok(ApiResponse.ok("Projet mis à jour", projetService.update(id, projet)));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<ApiResponse<Projet>> changeStatut(@PathVariable Long id, @RequestParam StatutProjet statut) {
        return ResponseEntity.ok(ApiResponse.ok("Statut mis à jour", projetService.changeStatut(id, statut)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        projetService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Projet supprimé", null));
    }
}
