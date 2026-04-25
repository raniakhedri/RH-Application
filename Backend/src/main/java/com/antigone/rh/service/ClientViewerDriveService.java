package com.antigone.rh.service;

import com.antigone.rh.dto.DriveFileDTO;
import com.antigone.rh.dto.MonthFilesDTO;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

/**
 * Read-only Drive service for the client portal.
 * Uses the "client-antigone" viewer service account.
 * Scope: DRIVE_READONLY — can list/read files but cannot create or modify
 * anything.
 */
@Service
@Slf4j
public class ClientViewerDriveService {

    @Value("${app.google.drive.client-viewer-key-path:client-viewer-service-account.json}")
    private String viewerKeyPath;

    @Value("${app.google.drive.parent-folder-id:}")
    private String parentFolderId;

    private static final String APPLICATION_NAME = "Antigone RH Client Viewer";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_READONLY);

    // French month name prefixes (lowercase) used to detect month folders
    private static final Set<String> FRENCH_MONTHS = new HashSet<>(Arrays.asList(
            "janvier", "février", "fevrier", "mars", "avril", "mai", "juin",
            "juillet", "août", "aout", "septembre", "octobre", "novembre", "décembre", "decembre"));

    private Drive driveService;

    @PostConstruct
    public void init() {
        try {
            reinit();
            log.info("ClientViewerDriveService initialized (status: {})",
                    driveService != null ? "Ready" : "Failed – key file missing?");
        } catch (IOException e) {
            log.warn("ClientViewerDriveService init failed: {}", e.getMessage());
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * Finds the root client folder by name and returns its webViewLink.
     */
    public String getClientFolderLink(String clientName) {
        if (driveService == null)
            return null;
        try {
            String folderId = findFolderIdByName(sanitize(clientName), parentFolderId);
            if (folderId == null)
                return null;
            File f = driveService.files().get(folderId).setFields("webViewLink").execute();
            return f.getWebViewLink();
        } catch (Exception e) {
            log.error("ClientViewer: error getting folder link for '{}': {}", clientName, e.getMessage());
            return null;
        }
    }

    /**
     * Returns all files in the client's Drive folder grouped by month.
     * Traverses up to 5 levels deep. Detects month folders by their French name.
     */
    public List<MonthFilesDTO> getClientFilesGroupedByMonth(String clientName) {
        if (driveService == null)
            return Collections.emptyList();
        try {
            String clientFolderId = findFolderIdByName(sanitize(clientName), parentFolderId);
            if (clientFolderId == null) {
                log.warn("ClientViewer: no root folder found for '{}'", clientName);
                return Collections.emptyList();
            }

            // monthLabel → List<DriveFileDTO>
            Map<String, List<DriveFileDTO>> grouped = new LinkedHashMap<>();

            // Start recursive traversal from the client root folder.
            // We track the "current month label" as we descend.
            traverseFolder(clientFolderId, null, null, grouped, 0);

            // Build result list ordered by the month names found
            List<MonthFilesDTO> result = new ArrayList<>();
            for (Map.Entry<String, List<DriveFileDTO>> entry : grouped.entrySet()) {
                if (!entry.getValue().isEmpty()) {
                    result.add(new MonthFilesDTO(entry.getKey(), entry.getValue()));
                }
            }
            return result;
        } catch (Exception e) {
            log.error("ClientViewer: error listing files for '{}': {}", clientName, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Private traversal helpers
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * Recursively traverses a folder.
     * 
     * @param folderId   current Drive folder ID
     * @param monthLabel the month label inherited from a parent folder (null if not
     *                   yet inside a month)
     * @param subFolder  the sub-folder label (e.g. "Posts", "Video") if known
     * @param grouped    accumulator: monthLabel → files
     * @param depth      recursion depth guard (max 5)
     */
    private void traverseFolder(String folderId, String monthLabel, String subFolder,
            Map<String, List<DriveFileDTO>> grouped, int depth) throws IOException {
        if (depth > 5)
            return;

        String pageToken = null;
        do {
            FileList result = driveService.files().list()
                    .setQ("'" + folderId + "' in parents and trashed=false")
                    .setFields(
                            "nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, size, modifiedTime)")
                    .setPageSize(200)
                    .setPageToken(pageToken)
                    .execute();

            for (File f : (result.getFiles() != null ? result.getFiles() : Collections.<File>emptyList())) {
                boolean isFolder = "application/vnd.google-apps.folder".equals(f.getMimeType());

                if (isFolder) {
                    // Determine if this folder represents a month or a year
                    String childMonthLabel = monthLabel;
                    String childSubFolder = subFolder;

                    String folderName = f.getName();
                    if (isMonthFolder(folderName)) {
                        childMonthLabel = capitalizeFirst(folderName);
                        childSubFolder = null; // reset subfolder when entering a fresh month folder
                    } else if (!isYearFolder(folderName) && monthLabel != null) {
                        // Inside a month — treat this as a subfolder (Posts, Video, Mediaplan…)
                        childSubFolder = folderName;
                    }
                    traverseFolder(f.getId(), childMonthLabel, childSubFolder, grouped, depth + 1);
                } else {
                    // It's a file — add to the appropriate month bucket
                    String label = (monthLabel != null) ? monthLabel : "Divers";
                    grouped.computeIfAbsent(label, k -> new ArrayList<>())
                            .add(toDTO(f, subFolder));
                }
            }
            pageToken = result.getNextPageToken();
        } while (pageToken != null);
    }

    private DriveFileDTO toDTO(File f, String subFolder) {
        return new DriveFileDTO(
                f.getId(),
                f.getName(),
                f.getMimeType(),
                f.getWebViewLink(),
                f.getThumbnailLink(),
                f.getSize(),
                f.getModifiedTime() != null ? f.getModifiedTime().toStringRfc3339() : null,
                subFolder);
    }

    /** Returns true if the folder name starts with a French month name */
    private boolean isMonthFolder(String name) {
        if (name == null)
            return false;
        String lower = name.toLowerCase().trim();
        for (String month : FRENCH_MONTHS) {
            if (lower.startsWith(month))
                return true;
        }
        return false;
    }

    /** Returns true if the folder name looks like a year (4 digits) */
    private boolean isYearFolder(String name) {
        return name != null && name.trim().matches("\\d{4}");
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty())
            return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private String sanitize(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Drive helpers
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * Finds a folder by exact name inside a given parent (or any folder if parentId
     * is blank).
     * Returns the folder ID, or null if not found.
     */
    private String findFolderIdByName(String folderName, String parentId) throws IOException {
        String escaped = folderName.replace("'", "\\'");
        String query = "mimeType='application/vnd.google-apps.folder' and name='" + escaped + "' and trashed=false";
        if (parentId != null && !parentId.isEmpty()) {
            query += " and '" + parentId + "' in parents";
        }
        FileList result = driveService.files().list()
                .setQ(query)
                .setFields("files(id)")
                .setPageSize(1)
                .execute();
        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }
        return null;
    }

    private void reinit() throws IOException {
        java.io.File keyFile = new java.io.File(viewerKeyPath);
        if (!keyFile.exists()) {
            log.warn("Client-viewer key not found at: {}", keyFile.getAbsolutePath());
            driveService = null;
            return;
        }
        try (FileInputStream fis = new FileInputStream(keyFile)) {
            GoogleCredentials credentials = ServiceAccountCredentials.fromStream(fis).createScoped(SCOPES);
            final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            driveService = new Drive.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            log.info("ClientViewerDriveService initialized with key: {}", keyFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to load client-viewer credentials: {}", e.getMessage());
            driveService = null;
        }
    }
}
