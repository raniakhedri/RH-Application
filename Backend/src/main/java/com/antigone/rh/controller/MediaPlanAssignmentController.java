package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.MediaPlanAssignmentDTO;
import com.antigone.rh.dto.MediaPlanAssignmentRequest;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.service.MediaPlanAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/media-plan-assignments")
@RequiredArgsConstructor
public class MediaPlanAssignmentController {

    private final MediaPlanAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<List<MediaPlanAssignmentDTO>>> assign(
            @RequestBody MediaPlanAssignmentRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Employés assignés", assignmentService.assignEmployees(request)));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<MediaPlanAssignmentDTO>>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getByClient(clientId)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<MediaPlanAssignmentDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getByEmploye(employeId)));
    }

    @GetMapping("/social-media-employees")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSocialMediaEmployees() {
        List<Employe> employees = assignmentService.getSocialMediaEmployees();
        List<Map<String, Object>> dtos = employees.stream()
                .map(e -> Map.<String, Object>of(
                        "id", e.getId(),
                        "nom", e.getNom(),
                        "prenom", e.getPrenom(),
                        "departement", e.getDepartement() != null ? e.getDepartement() : "",
                        "email", e.getEmail() != null ? e.getEmail() : ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long id) {
        assignmentService.removeAssignment(id);
        return ResponseEntity.ok(ApiResponse.ok("Assignation supprimée", null));
    }
}
