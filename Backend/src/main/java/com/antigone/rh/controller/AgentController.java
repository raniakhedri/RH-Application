package com.antigone.rh.controller;

import com.antigone.rh.dto.*;
import com.antigone.rh.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    /**
     * POST /api/agent/heartbeat
     * Appelé par l'agent toutes les minutes
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<String>> heartbeat(@RequestBody AgentHeartbeatRequest request) {
        agentService.processHeartbeat(request);
        return ResponseEntity.ok(ApiResponse.ok("Heartbeat reçu", "OK"));
    }

    /**
     * POST /api/agent/event
     * Événements: CLOCK_IN, CLOCK_OUT, etc.
     */
    @PostMapping("/event")
    public ResponseEntity<ApiResponse<String>> event(@RequestBody AgentEventRequest request) {
        agentService.processEvent(request);
        return ResponseEntity.ok(ApiResponse.ok("Événement traité", "OK"));
    }

    /**
     * POST /api/agent/presence-confirm
     * Confirmation de présence via popup
     */
    @PostMapping("/presence-confirm")
    public ResponseEntity<ApiResponse<String>> presenceConfirm(@RequestBody AgentPresenceConfirmRequest request) {
        agentService.processPresenceConfirm(request);
        return ResponseEntity.ok(ApiResponse.ok("Confirmation traitée", "OK"));
    }

    /**
     * GET /api/agent/config
     * Retourne la configuration pour l'agent
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<AgentConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(agentService.getConfig()));
    }

    /**
     * GET /api/agent/dashboard
     * Statut temps réel de tous les employés (pour le dashboard admin)
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<List<DashboardEmployeStatus>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(agentService.getDashboardStatuses()));
    }
}
