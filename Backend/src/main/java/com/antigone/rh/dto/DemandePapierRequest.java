package com.antigone.rh.dto;

import lombok.Data;

@Data
public class DemandePapierRequest {
    private String raison; // stored as "[libellé] raison"
    private Long employeId;
    private String motifAnnulation; // used for cancel
}
