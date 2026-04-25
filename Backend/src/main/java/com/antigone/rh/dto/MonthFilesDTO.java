package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthFilesDTO {
    /** e.g. "Avril 2026" */
    private String monthLabel;
    private List<DriveFileDTO> files;
}
