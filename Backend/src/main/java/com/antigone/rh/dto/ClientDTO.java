package com.antigone.rh.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDTO {

    private Long id;
    private String nom;
    private String description;
    private String telephone;
    /** Responsible person (free text) */
    private String responsable;
    private String fileName;
    /** URL to download/preview the attached file */
    private String fileUrl;

    private LocalDateTime dateCreation;
}
