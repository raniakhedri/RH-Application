package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.RapportInactiviteDTO;
import com.antigone.rh.enums.DecisionInactivite;
import com.antigone.rh.service.RapportInactiviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports-inactivite")
@RequiredArgsConstructor
public class RapportInactiviteController {

    private final RapportInactiviteService rapportInactiviteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RapportInactiviteDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(rapportInactiviteService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RapportInactiviteDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(rapportInactiviteService.findById(id)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<RapportInactiviteDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(rapportInactiviteService.findByEmploye(employeId)));
    }

    @GetMapping("/en-attente")
    public ResponseEntity<ApiResponse<List<RapportInactiviteDTO>>> getEnAttente() {
        return ResponseEntity.ok(ApiResponse.ok(rapportInactiviteService.findEnAttente()));
    }

    /**
     * POST /api/rapports-inactivite/generer
     * Génère les rapports pour la semaine courante
     */
    @PostMapping("/generer")
    public ResponseEntity<ApiResponse<List<RapportInactiviteDTO>>> generer() {
        return ResponseEntity.ok(ApiResponse.ok("Rapports générés",
                rapportInactiviteService.genererRapportsHebdomadaires()));
    }

    /**
     * POST /api/rapports-inactivite/generer-periode
     */
    @PostMapping("/generer-periode")
    public ResponseEntity<ApiResponse<List<RapportInactiviteDTO>>> genererPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(ApiResponse.ok("Rapports générés",
                rapportInactiviteService.genererRapportsHebdomadaires(debut, fin)));
    }

    /**
     * PUT /api/rapports-inactivite/{id}/decider
     * Body: { "adminEmployeId": 1, "decision": "DEDUIT", "commentaire": "..." }
     */
    @PutMapping("/{id}/decider")
    public ResponseEntity<ApiResponse<RapportInactiviteDTO>> decider(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long adminEmployeId = Long.valueOf(body.get("adminEmployeId").toString());
        DecisionInactivite decision = DecisionInactivite.valueOf(body.get("decision").toString());
        String commentaire = body.get("commentaire") != null ? body.get("commentaire").toString() : null;

        return ResponseEntity.ok(ApiResponse.ok("Décision enregistrée",
                rapportInactiviteService.decider(id, adminEmployeId, decision, commentaire)));
    }
}
