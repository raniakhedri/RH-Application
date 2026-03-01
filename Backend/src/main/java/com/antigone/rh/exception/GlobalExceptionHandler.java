package com.antigone.rh.exception;

import com.antigone.rh.dto.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause().getMessage();
        String userMessage = "Erreur de données dupliquées";

        if (message != null) {
            if (message.contains("(cin)")) {
                userMessage = "Ce numéro CIN existe déjà";
            } else if (message.contains("(email)")) {
                userMessage = "Cette adresse email existe déjà";
            } else if (message.contains("(matricule)")) {
                userMessage = "Ce matricule existe déjà";
            } else if (message.contains("(cnss)")) {
                userMessage = "Ce numéro CNSS existe déjà";
            } else if (message.contains("uk_") || message.contains("unique")) {
                userMessage = "Une valeur unique est déjà utilisée par un autre enregistrement";
            }
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(userMessage));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Erreur interne du serveur: " + ex.getMessage()));
    }
}
