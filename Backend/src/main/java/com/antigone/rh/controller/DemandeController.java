package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.DemandeRequest;
import com.antigone.rh.dto.DemandeResponse;
import com.antigone.rh.dto.HistoriqueStatutDTO;
import com.antigone.rh.enums.StatutDemande;
import com.antigone.rh.service.DemandeService;
import com.antigone.rh.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DemandeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findById(id)));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findByEmploye(employeId)));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> getByStatut(@PathVariable StatutDemande statut) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.findByStatut(statut)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DemandeResponse>> create(@RequestBody DemandeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Demande créée", demandeService.create(request)));
    }

    @PostMapping(value = "/with-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DemandeResponse>> createWithFile(
            @RequestPart("demande") DemandeRequest request,
            @RequestPart(value = "justificatif", required = false) MultipartFile justificatif) {
        if (justificatif != null && !justificatif.isEmpty()) {
            String storedFilename = fileStorageService.store(justificatif);
            request.setJustificatifPath(storedFilename);
        }
        return ResponseEntity.ok(ApiResponse.ok("Demande créée", demandeService.create(request)));
    }

    @GetMapping("/fichier/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.getFilePath(filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<DemandeResponse>> approve(
            @PathVariable Long id, @RequestParam Long adminEmployeId) {
        return ResponseEntity.ok(ApiResponse.ok("Demande approuvée", demandeService.approve(id, adminEmployeId)));
    }

    @PatchMapping("/{id}/refuse")
    public ResponseEntity<ApiResponse<DemandeResponse>> refuse(
            @PathVariable Long id, @RequestParam Long adminEmployeId,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(ApiResponse.ok("Demande refusée", demandeService.refuse(id, adminEmployeId, commentaire)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<DemandeResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Demande annulée", demandeService.cancel(id)));
    }

    @PatchMapping("/batch/approve")
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> batchApprove(
            @RequestBody List<Long> ids, @RequestParam Long adminEmployeId) {
        return ResponseEntity.ok(ApiResponse.ok("Demandes approuvées", demandeService.batchApprove(ids, adminEmployeId)));
    }

    @PatchMapping("/batch/refuse")
    public ResponseEntity<ApiResponse<List<DemandeResponse>>> batchRefuse(
            @RequestBody List<Long> ids, @RequestParam Long adminEmployeId,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(ApiResponse.ok("Demandes refusées", demandeService.batchRefuse(ids, adminEmployeId, commentaire)));
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<ApiResponse<List<HistoriqueStatutDTO>>> getHistorique(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(demandeService.getHistorique(id)));
    }
}
