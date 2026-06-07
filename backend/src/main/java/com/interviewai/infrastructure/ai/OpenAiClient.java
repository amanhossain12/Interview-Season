package com.interviewai.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class OpenAiClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.base-url}")
    private String baseUrl;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.max-tokens}")
    private int maxTokens;

    public String chat(String systemPrompt, String userMessage) {
        return chat(systemPrompt, userMessage, model, maxTokens);
    }

    public String chat(String systemPrompt, String userMessage, String modelName, int tokens) {
        Map<String, Object> requestBody = Map.of(
            "model", modelName,
            "max_tokens", tokens,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
            ),
            "temperature", 0.7
        );

        try {
            WebClient client = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

            String responseBody = client.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service temporarily unavailable", e);
        }
    }

    public String chatJson(String systemPrompt, String userMessage) {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", maxTokens,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt + "\n\nRespond ONLY with valid JSON."),
                Map.of("role", "user", "content", userMessage)
            ),
            "temperature", 0.3,
            "response_format", Map.of("type", "json_object")
        );

        try {
            WebClient client = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

            String responseBody = client.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("OpenAI JSON API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service temporarily unavailable", e);
        }
    }
}
