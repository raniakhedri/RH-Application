package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.dto.EmployeStatsDTO;
import com.antigone.rh.dto.SoldeCongeInfo;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.ReferentielRepository;
import com.antigone.rh.service.EmployeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/employes")
@RequiredArgsConstructor
public class EmployeController {

    private final EmployeService employeService;
    private final ReferentielRepository referentielRepository;

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

    @GetMapping("/by-role/{roleName}")
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> getByRole(@PathVariable String roleName) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findByRoleName(roleName)));
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

    @GetMapping("/{id}/solde-info")
    public ResponseEntity<ApiResponse<SoldeCongeInfo>> getSoldeInfo(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.getSoldeCongeInfo(id)));
    }

    @GetMapping("/horaire-entreprise")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHoraireEntreprise() {
        Map<String, Object> result = new HashMap<>();
        result.put("heureDebut", getRef("HEURE_DEBUT_TRAVAIL", "08:00"));
        result.put("heureFin", getRef("HEURE_FIN_TRAVAIL", "18:00"));
        result.put("joursTravail", getRef("JOURS_TRAVAIL", "LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI"));
        result.put("maxAutorisationMinutes", getRef("MAX_AUTORISATION_MINUTES", "120"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // =================== MÉTIERS AVANCÉS ===================

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<EmployeStatsDTO>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(employeService.getStatistics()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> search(
            @RequestParam(required = false) String departement,
            @RequestParam(required = false) String typeContrat,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String poste,
            @RequestParam(required = false) String dateEmbaucheFrom,
            @RequestParam(required = false) String dateEmbaucheTo,
            @RequestParam(required = false) Double salaireMin,
            @RequestParam(required = false) Double salaireMax,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(
                employeService.advancedSearch(departement, typeContrat, genre, poste,
                        dateEmbaucheFrom, dateEmbaucheTo, salaireMin, salaireMax, managerId, q)));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv() {
        byte[] csvBytes = employeService.exportToCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employes.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    @GetMapping("/organigramme")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOrganigramme() {
        return ResponseEntity.ok(ApiResponse.ok(employeService.getOrganigramme()));
    }

    private String getRef(String libelle, String defaultValue) {
        return referentielRepository
                .findByLibelleAndTypeReferentiel(libelle, TypeReferentiel.PARAMETRE_SYSTEME)
                .map(ref -> ref.getValeur() != null ? ref.getValeur() : defaultValue)
                .orElse(defaultValue);
    }
}
