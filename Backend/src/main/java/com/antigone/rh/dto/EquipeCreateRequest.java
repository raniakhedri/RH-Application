package com.antigone.rh.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class EquipeCreateRequest {
    private String nom;
    private Long projetId; // nullable - equipe can exist without project
    private List<Long> memberIds = new ArrayList<>();
}
