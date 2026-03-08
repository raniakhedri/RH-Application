package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.CompetenceDTO;
import com.antigone.rh.service.CompetenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/competences")
@RequiredArgsConstructor
public class CompetenceController {

    private final CompetenceService competenceService;

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<CompetenceDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(competenceService.findByEmployeId(employeId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompetenceDTO>> create(@RequestBody CompetenceDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Compétence ajoutée", competenceService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompetenceDTO>> update(@PathVariable Long id, @RequestBody CompetenceDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Compétence mise à jour", competenceService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        competenceService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Compétence supprimée", null));
    }
}
