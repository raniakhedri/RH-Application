package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.ClientDTO;
import com.antigone.rh.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Clients récupérés", clientService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Client récupéré", clientService.getById(id)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ClientDTO>> create(
            @RequestParam("nom") String nom,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "telephone", required = false) String telephone,
            @RequestParam(value = "responsable", required = false) String responsable,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            ClientDTO dto = clientService.create(nom, description, telephone, responsable, file);
            return ResponseEntity.ok(ApiResponse.ok("Client créé", dto));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur upload: " + e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ClientDTO>> update(
            @PathVariable Long id,
            @RequestParam(value = "nom", required = false) String nom,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "telephone", required = false) String telephone,
            @RequestParam(value = "responsable", required = false) String responsable,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            ClientDTO dto = clientService.update(id, nom, description, telephone, responsable, file);
            return ResponseEntity.ok(ApiResponse.ok("Client modifié", dto));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Erreur upload: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            clientService.delete(id);
            return ResponseEntity.ok(ApiResponse.ok("Client supprimé", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── File download/preview ─────────────────────────────────────────────────
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            Resource resource = clientService.loadFile(id);
            String filename = resource.getFilename();
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (filename != null) {
                if (filename.endsWith(".pdf"))
                    mediaType = MediaType.APPLICATION_PDF;
                else if (filename.endsWith(".png"))
                    mediaType = MediaType.IMAGE_PNG;
                else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
                    mediaType = MediaType.IMAGE_JPEG;
            }
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
