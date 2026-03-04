package com.antigone.rh.controller;

import com.antigone.rh.enums.SourcePointage;
import com.antigone.rh.repository.PointageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
@Slf4j
public class AgentDownloadController {

    private final PointageRepository pointageRepository;

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadAgent() {
        try {
            // Chercher l'installeur dans le dossier AgentDesktop/dist
            Path agentDir = Paths.get(System.getProperty("user.dir"))
                    .getParent() // Backend -> RH-Application
                    .resolve("AgentDesktop")
                    .resolve("dist");

            File distDir = agentDir.toFile();
            if (!distDir.exists()) {
                log.error("Dossier dist de l'agent non trouvé: {}", distDir.getAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            // Trouver le fichier .exe
            File[] exeFiles = distDir.listFiles((dir, name) -> name.endsWith(".exe") && name.contains("Setup"));

            if (exeFiles == null || exeFiles.length == 0) {
                log.error("Aucun installeur trouvé dans: {}", distDir.getAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            File installer = exeFiles[0];
            Resource resource = new FileSystemResource(installer);

            log.info("Téléchargement de l'agent: {} ({} MB)",
                    installer.getName(), installer.length() / (1024 * 1024));

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + installer.getName() + "\"")
                    .contentLength(installer.length())
                    .body(resource);

        } catch (Exception e) {
            log.error("Erreur téléchargement agent: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/info")
    public ResponseEntity<?> getAgentInfo(@RequestParam(required = false) Long employeId) {
        try {
            // Vérifier si l'employé a déjà l'agent (au moins 1 pointage AUTOMATIQUE)
            if (employeId != null) {
                boolean hasAgent = pointageRepository.existsByEmployeIdAndSource(employeId, SourcePointage.AUTOMATIQUE);
                if (hasAgent) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("available", false);
                    result.put("alreadyInstalled", true);
                    result.put("message", "L'agent est déjà installé sur votre poste");
                    return ResponseEntity.ok(result);
                }
            }

            Path agentDir = Paths.get(System.getProperty("user.dir"))
                    .getParent()
                    .resolve("AgentDesktop")
                    .resolve("dist");

            File distDir = agentDir.toFile();
            if (!distDir.exists()) {
                return ResponseEntity.ok(java.util.Map.of(
                        "available", false,
                        "message", "L'agent n'est pas encore disponible"));
            }

            File[] exeFiles = distDir.listFiles((dir, name) -> name.endsWith(".exe") && name.contains("Setup"));

            if (exeFiles == null || exeFiles.length == 0) {
                return ResponseEntity.ok(java.util.Map.of(
                        "available", false));
            }

            File installer = exeFiles[0];
            return ResponseEntity.ok(java.util.Map.of(
                    "available", true,
                    "fileName", installer.getName(),
                    "fileSize", installer.length(),
                    "fileSizeMB", String.format("%.1f", installer.length() / (1024.0 * 1024.0)),
                    "version", "1.0.0"));

        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Map.of(
                    "available", false,
                    "message", e.getMessage()));
        }
    }
}
