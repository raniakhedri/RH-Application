package com.antigone.rh.dto;

import lombok.Data;

@Data
public class ClientLoginRequest {
    private String loginClient;
    private String passwordClient;
}
