package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.ClientLoginRequest;
import com.antigone.rh.dto.ClientLoginResponse;
import com.antigone.rh.dto.ForgotPasswordRequest;
import com.antigone.rh.dto.LoginRequest;
import com.antigone.rh.dto.LoginResponse;
import com.antigone.rh.dto.ResetPasswordRequest;
import com.antigone.rh.service.ClientService;
import com.antigone.rh.service.CompteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CompteService compteService;
    private final ClientService clientService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        try {
            String ipAddress = httpRequest.getRemoteAddr();
            LoginResponse response = compteService.login(request, ipAddress);
            return ResponseEntity.ok(ApiResponse.ok("Connexion réussie", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/client-login")
    public ResponseEntity<ApiResponse<ClientLoginResponse>> clientLogin(
            @RequestBody ClientLoginRequest request) {
        try {
            ClientLoginResponse response = clientService.loginClient(
                    request.getLoginClient(), request.getPasswordClient());
            return ResponseEntity.ok(ApiResponse.ok("Connexion client réussie", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            compteService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(ApiResponse.ok(
                    "Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.", null));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.ok(
                    "Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.", null));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            compteService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.ok("Mot de passe réinitialisé avec succès", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
