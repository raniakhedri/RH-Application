package com.antigone.rh.dto;

import lombok.Data;

@Data
public class MediaPlanCommentRequest {
    private Long mediaPlanId;
    private String draftKey;
    private String columnKey;
    private String content;
    private Long auteurId;
    /** Used for WebSocket broadcast: clientId + monthKey to identify the sheet */
    private Long clientId;
    private String monthKey;
}
