package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.EmployeDTO;
import com.antigone.rh.service.EmployeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employes")
@RequiredArgsConstructor
public class EmployeController {

    private final EmployeService employeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findById(id)));
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<ApiResponse<EmployeDTO>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findByMatricule(matricule)));
    }

    @GetMapping("/{id}/subordinates")
    public ResponseEntity<ApiResponse<List<EmployeDTO>>> getSubordinates(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(employeService.findSubordinates(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeDTO>> create(@RequestBody EmployeDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Employé créé", employeService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeDTO>> update(@PathVariable Long id, @RequestBody EmployeDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Employé mis à jour", employeService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Employé supprimé", null));
    }

    @PatchMapping("/{id}/solde-conge")
    public ResponseEntity<ApiResponse<Void>> updateSoldeConge(@PathVariable Long id, @RequestParam Double solde) {
        employeService.updateSoldeConge(id, solde);
        return ResponseEntity.ok(ApiResponse.ok("Solde congé mis à jour", null));
    }
}
