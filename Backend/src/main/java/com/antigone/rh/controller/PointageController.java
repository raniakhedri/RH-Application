package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.entity.Pointage;
import com.antigone.rh.service.PointageService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pointages")
@RequiredArgsConstructor
public class PointageController {

    private final PointageService pointageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Pointage>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(pointageService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Pointage>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(pointageService.findById(id)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<Pointage>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(pointageService.findByEmploye(employeId)));
    }

    @GetMapping("/employe/{employeId}/range")
    public ResponseEntity<ApiResponse<List<Pointage>>> getByEmployeAndDateRange(
            @PathVariable Long employeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.ok(pointageService.findByEmployeAndDateRange(employeId, start, end)));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<List<Pointage>>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(pointageService.findByDate(date)));
    }

    @PostMapping("/clock-in/{employeId}")
    public ResponseEntity<ApiResponse<Pointage>> clockIn(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok("Entrée enregistrée", pointageService.clockIn(employeId)));
    }

    @PostMapping("/clock-out/{employeId}")
    public ResponseEntity<ApiResponse<Pointage>> clockOut(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok("Sortie enregistrée", pointageService.clockOut(employeId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        pointageService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Pointage supprimé", null));
    }
}
