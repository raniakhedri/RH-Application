package com.antigone.rh.controller;

import com.antigone.rh.dto.ApiResponse;
import com.antigone.rh.dto.ClientAssistantAskRequest;
import com.antigone.rh.dto.ClientAssistantMessageDTO;
import com.antigone.rh.dto.ClientAssistantResponse;
import com.antigone.rh.service.ClientAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-assistant")
@RequiredArgsConstructor
public class ClientAssistantController {

    private final ClientAssistantService clientAssistantService;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ClientAssistantResponse>> ask(@RequestBody ClientAssistantAskRequest request) {
        ClientAssistantResponse response = clientAssistantService.ask(request);
        return ResponseEntity.ok(ApiResponse.ok("Client assistant response", response));
    }

    @GetMapping("/thread/{threadId}")
    public ResponseEntity<ApiResponse<List<ClientAssistantMessageDTO>>> getThread(
            @PathVariable String threadId,
            @RequestParam("clientId") Long clientId) {
        List<ClientAssistantMessageDTO> messages = clientAssistantService.getThreadMessages(threadId, clientId);
        return ResponseEntity.ok(ApiResponse.ok("Client assistant thread", messages));
    }
}
