package com.antigone.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiClient {

    @Value("${app.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${app.ai.gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1}")
    private String baseUrl;

    private final ObjectMapper objectMapper;

    public String generateContent(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Gemini API key is missing");
        }

        String url = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("role", "user");
        content.put("parts", List.of(part));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.2);
        generationConfig.put("maxOutputTokens", 1024);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));
        body.put("generationConfig", generationConfig);

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.postForEntity(url, body, String.class);

        if (response.getBody() == null || response.getBody().isBlank()) {
            throw new RuntimeException("Gemini response is empty");
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new RuntimeException("Gemini response has no content");
            }
            return textNode.asText();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to parse Gemini response: " + ex.getMessage());
        }
    }
}
