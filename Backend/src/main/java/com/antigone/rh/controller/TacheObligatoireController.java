package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.TacheObligatoireDTO;
import com.antigone.rh.dto.TacheObligatoireRequest;
import com.antigone.rh.service.TacheObligatoireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taches-obligatoires")
@RequiredArgsConstructor
public class TacheObligatoireController {

    private final TacheObligatoireService tacheObligatoireService;

    @PostMapping
    public ResponseEntity<ApiResponse<TacheObligatoireDTO>> create(@RequestBody TacheObligatoireRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(tacheObligatoireService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TacheObligatoireDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(tacheObligatoireService.findAll()));
    }

    @GetMapping("/employe/{employeId}")
    public ResponseEntity<ApiResponse<List<TacheObligatoireDTO>>> getByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ApiResponse.ok(tacheObligatoireService.findByEmploye(employeId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        tacheObligatoireService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
