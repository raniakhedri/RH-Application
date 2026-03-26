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

    /** Returns clients filtered by the caller's permissions. */
    public List<ClientDTO> getAll(Set<String> permissions) {
        List<Client> clients;
        if (permissions.contains("CREATE_CLIENT")) {
            clients = clientRepository.findAll();
        } else if (permissions.contains("VALIDATE_CLIENT_DA")
                && !permissions.contains("VALIDATE_CLIENT_COO")) {
            clients = clientRepository.findByCeoValidatedTrueAndCooValidatedTrue();
        } else {
            clients = clientRepository.findAll();
        }
        return clients.stream().map(this::toDTO).collect(Collectors.toList());
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

    // ── Validation steps ──────────────────────────────────────────────────────

    /** CEO validates only → COO + DA still required */
    public ClientDTO validateCeo(Long id, boolean validated) {
        Client client = findOrThrow(id);
        client.setCeoValidated(validated);
        if (!validated) {
            client.setCooValidated(false);
            client.setDaValidated(false);
        }
        return toDTO(clientRepository.save(client));
    }

    /** CEO validates all → skips COO + DA */
    public ClientDTO validateCeoAll(Long id) {
        Client client = findOrThrow(id);
        client.setCeoValidated(true);
        client.setCooValidated(true);
        client.setDaValidated(true);
        return toDTO(clientRepository.save(client));
    }

    /** COO validates only → DA still required */
    public ClientDTO validateCoo(Long id, boolean validated) {
        Client client = findOrThrow(id);
        if (!client.getCeoValidated())
            throw new RuntimeException("Le client doit d'abord être validé par le CEO.");
        client.setCooValidated(validated);
        if (!validated)
            client.setDaValidated(false);
        return toDTO(clientRepository.save(client));
    }

    /** COO validates all → skips DA */
    public ClientDTO validateCooAll(Long id) {
        Client client = findOrThrow(id);
        if (!client.getCeoValidated())
            throw new RuntimeException("Le client doit d'abord être validé par le CEO.");
        client.setCooValidated(true);
        client.setDaValidated(true);
        return toDTO(clientRepository.save(client));
    }

    /** DA validates */
    public ClientDTO validateDa(Long id, boolean validated) {
        Client client = findOrThrow(id);
        if (!client.getCeoValidated() || !client.getCooValidated())
            throw new RuntimeException("Le client doit d'abord être validé par CEO et COO.");
        client.setDaValidated(validated);
        return toDTO(clientRepository.save(client));
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
                .ceoValidated(c.getCeoValidated())
                .cooValidated(c.getCooValidated())
                .daValidated(c.getDaValidated())
                .dateCreation(c.getDateCreation())
                .build();
    }
}
