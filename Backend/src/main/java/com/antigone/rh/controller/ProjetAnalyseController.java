package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.ProjetAnalyseDTO;
import com.antigone.rh.service.ProjetAnalyseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
public class ProjetAnalyseController {

    private final ProjetAnalyseService projetAnalyseService;

    /**
     * GET /api/projets/{id}/rapport
     * Returns a full lifecycle analysis report for a single project.
     */
    @GetMapping("/{id}/rapport")
    public ResponseEntity<ApiResponse<ProjetAnalyseDTO>> getRapport(@PathVariable Long id) {
        try {
            ProjetAnalyseDTO rapport = projetAnalyseService.analyseProjet(id);
            return ResponseEntity.ok(ApiResponse.ok(rapport));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/projets/rapports
     * Returns lifecycle analysis reports for ALL projects.
     */
    @GetMapping("/rapports")
    public ResponseEntity<ApiResponse<List<ProjetAnalyseDTO>>> getAllRapports() {
        List<ProjetAnalyseDTO> rapports = projetAnalyseService.analyseAllProjets();
        return ResponseEntity.ok(ApiResponse.ok(rapports));
    }
}
