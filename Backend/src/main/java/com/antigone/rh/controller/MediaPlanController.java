package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.MediaPlanDTO;
import com.antigone.rh.dto.MediaPlanRequest;
import com.antigone.rh.service.MediaPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/media-plans")
@RequiredArgsConstructor
public class MediaPlanController {

    private final MediaPlanService mediaPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MediaPlanDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(mediaPlanService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaPlanDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(mediaPlanService.findById(id)));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<MediaPlanDTO>>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(mediaPlanService.findByClientId(clientId)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<MediaPlanDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(mediaPlanService.findByAssignedEmploye(employeId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MediaPlanDTO>> create(@RequestBody MediaPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Media plan créé", mediaPlanService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaPlanDTO>> update(@PathVariable Long id,
            @RequestBody MediaPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Media plan mis à jour", mediaPlanService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        mediaPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Media plan supprimé", null));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<MediaPlanDTO>> approve(@PathVariable Long id,
            @RequestParam Long managerId) {
        return ResponseEntity.ok(ApiResponse.ok("Media plan approuvé", mediaPlanService.approve(id, managerId)));
    }

    @PatchMapping("/{id}/disapprove")
    public ResponseEntity<ApiResponse<MediaPlanDTO>> disapprove(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Media plan désapprouvé", mediaPlanService.disapprove(id)));
    }
}
