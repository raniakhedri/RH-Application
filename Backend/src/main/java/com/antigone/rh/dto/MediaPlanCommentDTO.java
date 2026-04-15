package com.antigone.rh.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MediaPlanCommentDTO {
    private Long id;
    private Long mediaPlanId;
    private String draftKey;
    private String columnKey;
    private String content;
    private Long auteurId;
    private String auteurNom;
    private String auteurPrenom;
    private LocalDateTime createdAt;
}
