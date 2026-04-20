package com.antigone.rh.controller;

import com.antigone.rh.dto.AdminDashboardDTO;
import com.antigone.rh.dto.AlerteDTO;
import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.ProjetDetailAdminDTO;
import com.antigone.rh.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    /**
     * GET /api/admin/dashboard
     * Returns the global admin dashboard with KPIs, project summaries, and alerts.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AdminDashboardDTO>> getDashboard() {
        AdminDashboardDTO dashboard = adminDashboardService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    /**
     * GET /api/admin/dashboard/projet/{id}
     * Returns detailed view of a single project for admin.
     */
    @GetMapping("/projet/{id}")
    public ResponseEntity<ApiResponse<ProjetDetailAdminDTO>> getProjetDetail(@PathVariable Long id) {
        try {
            ProjetDetailAdminDTO detail = adminDashboardService.getProjetDetail(id);
            return ResponseEntity.ok(ApiResponse.ok(detail));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/admin/dashboard/alertes
     * Returns all current alerts across all projects.
     */
    @GetMapping("/alertes")
    public ResponseEntity<ApiResponse<List<AlerteDTO>>> getAlertes() {
        List<AlerteDTO> alertes = adminDashboardService.getAlertes();
        return ResponseEntity.ok(ApiResponse.ok(alertes));
    }
}
