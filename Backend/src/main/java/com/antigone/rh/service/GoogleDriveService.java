package com.antigone.rh.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.Permission;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class GoogleDriveService {

    @Value("${app.google.drive.service-account-key-path:service-account.json}")
    private String serviceAccountKeyPath;

    @Value("${app.google.drive.parent-folder-id:}")
    private String parentFolderId;

    private static final String APPLICATION_NAME = "Antigone RH";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE);

    private Drive driveService;

    @PostConstruct
    public void init() {
        try {
            reinit();
            log.info("Google Drive Service initialized with Service Account (status: {})",
                    driveService != null ? "Ready" : "Failed");
        } catch (IOException e) {
            log.error("Failed to initialize Google Drive Service: {}", e.getMessage());
        }
    }

    /**
     * Main entry point: gets or creates a 2-level folder hierarchy:
     * [parentFolder] / [clientName] / [monthName e.g. "Avril 2026"]
     * Returns the webViewLink of the month folder.
     */
    public String getOrCreateClientMonthFolder(String clientName, LocalDate date) throws IOException {
        ensureInitialized();

        // Format month folder name e.g. "Avril 2026"
        String monthRaw = date.getMonth().getDisplayName(TextStyle.FULL, Locale.FRENCH);
        String monthName = Character.toUpperCase(monthRaw.charAt(0)) + monthRaw.substring(1)
                + " " + date.getYear();

        // Sanitize client name for Drive
        String safeClientName = clientName.replaceAll("[\\\\/:*?\"<>|]", "_").trim();

        log.info("Resolving Drive path: [root:{}] / [{}] / [{}]", parentFolderId, safeClientName, monthName);

        // Step 1: Get or create the client folder inside parentFolderId
        String clientFolderId = getOrCreateFolder(safeClientName, parentFolderId);

        // Step 2: Get or create the month folder inside the client folder
        String monthFolderId = getOrCreateFolder(monthName, clientFolderId);

        // Fetch and return the webViewLink of the month folder
        File monthFolder = driveService.files().get(monthFolderId)
                .setFields("id, webViewLink")
                .execute();

        log.info("Drive path resolved. Month folder link: {}", monthFolder.getWebViewLink());
        return monthFolder.getWebViewLink();
    }

    /**
     * Finds an existing folder by name inside the given parent, or creates it.
     * Returns the folder ID.
     */
    private String getOrCreateFolder(String folderName, String parentId) throws IOException {
        String escapedName = folderName.replace("'", "\\'");
        String query = "mimeType='application/vnd.google-apps.folder'"
                + " and name='" + escapedName + "'"
                + " and trashed=false";

        if (parentId != null && !parentId.isEmpty()) {
            query += " and '" + parentId + "' in parents";
        }

        com.google.api.services.drive.model.FileList result = driveService.files().list()
                .setQ(query)
                .setFields("files(id, name)")
                .setPageSize(1)
                .execute();

        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            String existingId = result.getFiles().get(0).getId();
            log.info("Found existing folder '{}' (ID: {})", folderName, existingId);
            return existingId;
        }

        // Folder not found — create it
        File fileMetadata = new File();
        fileMetadata.setName(folderName);
        fileMetadata.setMimeType("application/vnd.google-apps.folder");
        if (parentId != null && !parentId.isEmpty()) {
            fileMetadata.setParents(Collections.singletonList(parentId));
        }

        File created = driveService.files().create(fileMetadata)
                .setFields("id")
                .execute();

        log.info("Created new folder '{}' (ID: {})", folderName, created.getId());

        // Make folder public with writer access
        try {
            Permission publicPermission = new Permission()
                    .setType("anyone")
                    .setRole("writer");
            driveService.permissions().create(created.getId(), publicPermission).execute();
            log.info("Folder '{}' set to public and editable.", folderName);
        } catch (Exception pe) {
            log.warn("Could not set public permissions on folder '{}': {}", folderName, pe.getMessage());
        }

        return created.getId();
    }

    private void ensureInitialized() throws IOException {
        if (driveService == null) {
            log.info("Drive service is null, attempting re-initialization...");
            reinit();
        }
        if (driveService == null) {
            throw new IOException("Google Drive service is not initialized. Please check service-account.json.");
        }
    }

    public boolean isAuthorized() {
        if (driveService != null)
            return true;
        try {
            reinit();
            return driveService != null;
        } catch (Exception e) {
            return false;
        }
    }

    private void reinit() throws IOException {
        try {
            java.io.File keyFile = new java.io.File(serviceAccountKeyPath);
            log.info("Attempting to load Service Account key from: {}", keyFile.getAbsolutePath());
            if (!keyFile.exists()) {
                log.warn("Service account key file DOES NOT EXIST at: {}", keyFile.getAbsolutePath());
                driveService = null;
                return;
            }

            try (FileInputStream fis = new FileInputStream(keyFile)) {
                GoogleCredentials credentials = ServiceAccountCredentials.fromStream(fis)
                        .createScoped(SCOPES);
                log.info("Service Account credentials loaded successfully (Email: {})",
                        ((ServiceAccountCredentials) credentials).getClientEmail());

                final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
                driveService = new Drive.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                        .setApplicationName(APPLICATION_NAME)
                        .build();

                log.info("Google Drive Service RE-INITIALIZED successfully with Service Account.");
            } catch (Exception e) {
                log.error("CRITICAL: Failed to load Service Account credentials from JSON: {}", e.getMessage(), e);
                driveService = null;
            }
        } catch (Exception e) {
            log.error("Unexpected error during Drive initialization: {}", e.getMessage(), e);
            driveService = null;
        }
    }

    // --- Obsolete OAuth2 methods kept for API compatibility ---

    public String getAuthorizationUrl() throws IOException {
        return null;
    }

    public void exchangeCodeForToken(String code) throws IOException {
        // No-op for service account
    }
}
