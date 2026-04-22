import os
import re

backend_dir = r"c:\Users\alaou\OneDrive\Documents\test-merge-ala-antigonerh\RH-Application\backend\src\main\java\com\antigone\rh"

service_path = os.path.join(backend_dir, r"service\GoogleDriveService.java")
with open(service_path, "r", encoding="utf-8") as f:
    s = f.read()

# imports
if "import org.springframework.scheduling.annotation.Async;" not in s:
    s = s.replace("import org.springframework.stereotype.Service;", "import org.springframework.stereotype.Service;\nimport org.springframework.scheduling.annotation.Async;")

async_method = """
    /**
     * Creates the deep Google Drive folder hierarchy for a client in the background.
     * Hierarchy: ClientName -> Year -> (Documentation, 12 Months -> (Posts, Video, Mediaplan))
     */
    @Async
    public void generateFullClientStructure(String clientName, int year) {
        try {
            ensureInitialized();
            
            String safeClientName = clientName.replaceAll("[\\\\/:*?\\"<>|]", "_").trim();
            log.info("Starting Async generation for Client: {} / Year: {}", safeClientName, year);
            
            // 1. Client Folder
            String clientFolderId = getOrCreateFolder(safeClientName, parentFolderId);
            
            // 2. Year Folder
            String yearFolderId = getOrCreateFolder(String.valueOf(year), clientFolderId);
            
            // 3. Documentation (at year level)
            getOrCreateFolder("Documentation", yearFolderId);
            
            // 4. All 12 Months
            String[] months = {"Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"};
            
            for (String month : months) {
                String monthFolderId = getOrCreateFolder(month, yearFolderId);
                // 5. 3 internal folders
                getOrCreateFolder("Posts", monthFolderId);
                getOrCreateFolder("Video", monthFolderId);
                getOrCreateFolder("Mediaplan", monthFolderId);
            }
            
            log.info("Successfully finished generating 51-folder structure for {} / {}", safeClientName, year);
            
        } catch (Exception e) {
            log.error("Async client folder generation failed for {}: {}", clientName, e.getMessage());
        }
    }

    /**
     * Gets the webViewLink for the root client folder on-demand.
     */
    public String getClientFolderLink(String clientName) {
        try {
            ensureInitialized();
            String safeClientName = clientName.replaceAll("[\\\\/:*?\\"<>|]", "_").trim();
            String escapedName = safeClientName.replace("'", "\\\\'");
            String query = "mimeType='application/vnd.google-apps.folder' and name='" + escapedName + "' and trashed=false";
            if (parentFolderId != null && !parentFolderId.isEmpty()) {
                query += " and '" + parentFolderId + "' in parents";
            }
            
            com.google.api.services.drive.model.FileList result = driveService.files().list()
                    .setQ(query)
                    .setFields("files(id, webViewLink)")
                    .setPageSize(1)
                    .execute();
                    
            if (result.getFiles() != null && !result.getFiles().isEmpty()) {
                return result.getFiles().get(0).getWebViewLink();
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to fetch client folder link for {}: {}", clientName, e.getMessage());
            return null;
        }
    }
"""

if "generateFullClientStructure" not in s:
    s = s.replace("private void ensureInitialized() throws IOException {", async_method + "\n    private void ensureInitialized() throws IOException {")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(s)
