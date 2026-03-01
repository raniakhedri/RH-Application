package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private Long compteId;
    private Long employeId;
    private String username;
    private String nom;
    private String prenom;
    private String email;
    private Set<String> roles;
    private Set<String> permissions;
    private Boolean mustChangePassword;
    private String message;
    private String imageUrl;
}
