package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.LoginRequest;
import com.antigone.rh.dto.LoginResponse;
import com.antigone.rh.service.CompteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CompteService compteService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = compteService.login(request);
            return ResponseEntity.ok(ApiResponse.ok("Connexion réussie", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(
            @RequestParam Long employeId,
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam(defaultValue = "EMPLOYE") String role) {
        try {
            compteService.createCompte(employeId, username, password, role);
            return ResponseEntity.ok(ApiResponse.ok("Compte créé avec succès", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
