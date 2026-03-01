package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.service.EmployeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employes")
@RequiredArgsConstructor
public class EmployeController {

    private final EmployeService employeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findById(id)));
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<ApiResponse<EmployeDTO>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findByMatricule(matricule)));
    }

    @GetMapping("/{id}/subordinates")
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> getSubordinates(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findSubordinates(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeDTO>> create(@RequestBody EmployeDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Employé créé", employeService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeDTO>> update(@PathVariable Long id, @RequestBody EmployeDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Employé mis à jour", employeService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Employé supprimé", null));
    }

    @PatchMapping("/{id}/solde-conge")
    public ResponseEntity<ApiResponse<Void>> updateSoldeConge(@PathVariable Long id, @RequestParam Double solde) {
        employeService.updateSoldeConge(id, solde);
        return ResponseEntity.ok(ApiResponse.ok("Solde congé mis à jour", null));
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<ApiResponse<EmployeDTO>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Le fichier est vide"));
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Le fichier doit être une image"));
            }
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(ApiResponse.error("L'image ne doit pas dépasser 5 Mo"));
            }

            // Create uploads directory
            String uploadDir = System.getProperty("user.dir") + "/uploads/images";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String extension = file.getOriginalFilename() != null
                    ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.'))
                    : ".jpg";
            String filename = UUID.randomUUID() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            // Update employee imageUrl
            String imageUrl = "/uploads/images/" + filename;
            EmployeDTO updated = employeService.updateImage(id, imageUrl);

            return ResponseEntity.ok(ApiResponse.ok("Image mise à jour", updated));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Erreur lors de l'upload: " + e.getMessage()));
        }
    }
}
