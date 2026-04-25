package com.antigone.rh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientLoginResponse {
    private Long clientId;
    private String nom;
    private String loginClient;
    private String email;
    /** Always true — used by the frontend to differentiate client sessions */
    private boolean isClient;
    /** Always ["CLIENT"] */
    private List<String> roles;
    /** Always ["VIEW_CLIENT_PORTAL"] */
    private List<String> permissions;
    /** Page keys the client is allowed to access: MEDIA_PLANS, PROJETS, FICHIERS */
    private List<String> clientPages;
}
