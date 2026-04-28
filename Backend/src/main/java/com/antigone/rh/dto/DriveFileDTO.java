package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveFileDTO {
    private String id;
    private String name;
    private String mimeType;
    /** Direct link to view the file in Google Drive */
    private String webViewLink;
    /** Thumbnail image URL (available for images, videos, PDFs, etc.) */
    private String thumbnailLink;
    /**
     * Usable for constructing an embed URL:
     * https://drive.google.com/file/d/{id}/preview
     */
    private Long size;
    private String modifiedTime;
    /** Sub-folder the file lives in (e.g. "Posts", "Video", "Mediaplan") */
    private String subFolder;
}
