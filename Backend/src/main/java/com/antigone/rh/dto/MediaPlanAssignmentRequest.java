package com.antigone.rh.dto;

import lombok.Data;

import java.util.List;

@Data
public class MediaPlanAssignmentRequest {
    private Long clientId;
    private List<Long> employeIds;
}
