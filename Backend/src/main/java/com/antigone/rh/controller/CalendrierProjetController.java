package com.antigone.rh.controller;

import com.antigone.rh.dto.CalendrierProjetDTO;
import com.antigone.rh.service.CalendrierProjetService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendrier-projets")
@RequiredArgsConstructor
public class CalendrierProjetController {

    private final CalendrierProjetService calendrierProjetService;

    @GetMapping("/between")
    public ResponseEntity<List<CalendrierProjetDTO>> getSlotsBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(calendrierProjetService.getSlotsBetween(startDate, endDate));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<CalendrierProjetDTO>> getManagerSlotsBetween(
            @PathVariable Long managerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(calendrierProjetService.getManagerSlotsBetween(managerId, startDate, endDate));
    }

    @PostMapping("/busy")
    public ResponseEntity<CalendrierProjetDTO> createBusySlot(@RequestBody CalendrierProjetDTO dto) {
        return ResponseEntity.ok(calendrierProjetService.createBusySlot(dto));
    }

    @PostMapping("/booked")
    public ResponseEntity<CalendrierProjetDTO> createBookedSlot(@RequestBody CalendrierProjetDTO dto) {
        return ResponseEntity.ok(calendrierProjetService.createBookedSlot(dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<CalendrierProjetDTO> updateSlotStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(calendrierProjetService.updateSlotStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        calendrierProjetService.deleteSlot(id);
        return ResponseEntity.ok().build();
    }
}
