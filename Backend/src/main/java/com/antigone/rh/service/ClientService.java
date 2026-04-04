package com.antigone.rh.service;

import com.antigone.rh.dto.ClientDTO;
import com.antigone.rh.entity.Client;
import com.antigone.rh.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;

    @Value("${app.upload.dir:uploads/justificatifs}")
    private String uploadDir;

    private static final String CLIENTS_SUBDIR = "clients";

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /** Returns all clients. */
    public List<ClientDTO> getAll() {
        return clientRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ClientDTO getById(Long id) {
        return toDTO(findOrThrow(id));
    }

    public ClientDTO create(String nom, String description, String telephone,
            String responsable, MultipartFile file) throws IOException {
        String filePath = null;
        String fileName = null;
        if (file != null && !file.isEmpty()) {
            fileName = file.getOriginalFilename();
            filePath = saveFile(file);
        }
        Client client = Client.builder()
                .nom(nom)
                .description(description)
                .telephone(telephone)
                .responsable(responsable)
                .filePath(filePath)
                .fileName(fileName)
                .build();
        return toDTO(clientRepository.save(client));
    }

    public ClientDTO update(Long id, String nom, String description, String telephone,
            String responsable, MultipartFile file) throws IOException {
        Client client = findOrThrow(id);
        if (nom != null)
            client.setNom(nom);
        if (description != null)
            client.setDescription(description);
        if (telephone != null)
            client.setTelephone(telephone.isBlank() ? null : telephone);
        if (responsable != null)
            client.setResponsable(responsable.isBlank() ? null : responsable);
        if (file != null && !file.isEmpty()) {
            deleteFile(client.getFilePath());
            client.setFileName(file.getOriginalFilename());
            client.setFilePath(saveFile(file));
        }
        return toDTO(clientRepository.save(client));
    }

    public void delete(Long id) {
        Client client = findOrThrow(id);
        deleteFile(client.getFilePath());
        clientRepository.delete(client);
    }

    // ── File ─────────────────────────────────────────────────────────────────

    public Resource loadFile(Long id) throws MalformedURLException {
        Client client = findOrThrow(id);
        if (client.getFilePath() == null)
            throw new RuntimeException("Aucun fichier attaché.");
        Path path = Paths.get(client.getFilePath()).toAbsolutePath().normalize();
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists())
            throw new RuntimeException("Fichier introuvable.");
        return resource;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String saveFile(MultipartFile file) throws IOException {
        Path dir = Paths.get(uploadDir, CLIENTS_SUBDIR).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String ext = getExtension(Objects.requireNonNull(file.getOriginalFilename()));
        String uniqueName = UUID.randomUUID() + ext;
        Path target = dir.resolve(uniqueName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    private void deleteFile(String filePath) {
        if (filePath != null) {
            try {
                Files.deleteIfExists(Paths.get(filePath));
            } catch (IOException ignored) {
            }
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return (dot >= 0) ? filename.substring(dot) : "";
    }

    private Client findOrThrow(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
    }

    public ClientDTO toDTO(Client c) {
        String fileUrl = (c.getFilePath() != null) ? "/api/clients/" + c.getId() + "/file" : null;
        return ClientDTO.builder()
                .id(c.getId())
                .nom(c.getNom())
                .description(c.getDescription())
                .telephone(c.getTelephone())
                .responsable(c.getResponsable())
                .fileName(c.getFileName())
                .fileUrl(fileUrl)
                .dateCreation(c.getDateCreation())
                .build();
    }
}
