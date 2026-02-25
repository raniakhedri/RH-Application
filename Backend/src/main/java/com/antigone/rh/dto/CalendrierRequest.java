package com.antigone.rh.dto;

import com.antigone.rh.enums.OrigineJour;
import com.antigone.rh.enums.TypeJour;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendrierRequest {
    private String dateJour;
    private String nomJour;
    private TypeJour typeJour;
    private OrigineJour origine;
    private String description;
    private Boolean estPaye;
}
