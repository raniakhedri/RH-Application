package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.ReunionDTO;
import com.antigone.rh.dto.ReunionRequest;
import com.antigone.rh.service.ReunionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reunions")
@RequiredArgsConstructor
public class ReunionController {

    private final ReunionService reunionService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReunionDTO>> create(
            @RequestBody ReunionRequest request,
            @RequestParam Long initiateurId) {
        return ResponseEntity.ok(ApiResponse.ok("Réunion créée", reunionService.create(request, initiateurId)));
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponse<ReunionDTO>> respond(
            @PathVariable Long id,
            @RequestParam boolean accepter) {
        return ResponseEntity.ok(ApiResponse.ok(
                accepter ? "Réunion acceptée" : "Réunion refusée",
                reunionService.respond(id, accepter)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<ReunionDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(reunionService.findByEmploye(employeId)));
    }

    @GetMapping("/employe/{employeId}/between")
    public ResponseEntity<ApiResponse<List<ReunionDTO>>> getByEmployeAndBetween(
            @PathVariable Long employeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.ok(reunionService.findByEmployeAndBetween(employeId, start, end)));
    }

    @GetMapping("/between")
    public ResponseEntity<ApiResponse<List<ReunionDTO>>> getBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.ok(reunionService.findBetween(start, end)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        reunionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Réunion supprimée", null));
    }
}
