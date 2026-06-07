package com.interviewai.infrastructure.judge0;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Base64;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class Judge0Client {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${judge0.api-key}")
    private String apiKey;

    @Value("${judge0.base-url}")
    private String baseUrl;

    @Value("${judge0.host}")
    private String host;

    // Language IDs for Judge0
    public static final int JAVA_ID = 62;
    public static final int PYTHON_ID = 71;
    public static final int JAVASCRIPT_ID = 63;
    public static final int CPP_ID = 54;

    public Judge0Result submitAndWait(String sourceCode, int languageId, String stdin) {
        try {
            String token = submit(sourceCode, languageId, stdin);
            return pollResult(token);
        } catch (Exception e) {
            log.error("Judge0 submission failed: {}", e.getMessage());
            throw new RuntimeException("Code execution service unavailable", e);
        }
    }

    private String submit(String sourceCode, int languageId, String stdin) throws Exception {
        Map<String, Object> body = Map.of(
            "source_code", Base64.getEncoder().encodeToString(sourceCode.getBytes()),
            "language_id", languageId,
            "stdin", stdin != null ? Base64.getEncoder().encodeToString(stdin.getBytes()) : "",
            "base64_encoded", true
        );

        WebClient client = buildClient();
        String response = client.post()
            .uri("/submissions?base64_encoded=true&wait=false")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        JsonNode node = objectMapper.readTree(response);
        return node.path("token").asText();
    }

    private Judge0Result pollResult(String token) throws Exception {
        WebClient client = buildClient();

        for (int i = 0; i < 10; i++) {
            Thread.sleep(1000);

            String response = client.get()
                .uri("/submissions/" + token + "?base64_encoded=true&fields=status,stdout,stderr,compile_output,time,memory")
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode node = objectMapper.readTree(response);
            int statusId = node.path("status").path("id").asInt();

            if (statusId > 2) { // Not queued or processing
                String stdout = decodeBase64(node.path("stdout").asText());
                String stderr = decodeBase64(node.path("stderr").asText());
                String compileOutput = decodeBase64(node.path("compile_output").asText());
                double time = node.path("time").asDouble();
                int memory = node.path("memory").asInt();
                String statusDesc = node.path("status").path("description").asText();

                return new Judge0Result(token, statusId, statusDesc, stdout, stderr, compileOutput, time, memory);
            }
        }

        return new Judge0Result(token, 3, "Time Limit Exceeded", "", "", "", 0, 0);
    }

    private WebClient buildClient() {
        return webClientBuilder
            .baseUrl(baseUrl)
            .defaultHeader("X-RapidAPI-Key", apiKey)
            .defaultHeader("X-RapidAPI-Host", host)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    private String decodeBase64(String encoded) {
        if (encoded == null || encoded.isBlank()) return "";
        try {
            return new String(Base64.getDecoder().decode(encoded));
        } catch (Exception e) {
            return encoded;
        }
    }

    public record Judge0Result(
        String token,
        int statusId,
        String statusDescription,
        String stdout,
        String stderr,
        String compileOutput,
        double executionTimeSeconds,
        int memoryKb
    ) {
        public boolean isAccepted() { return statusId == 3; }
        public boolean isCompileError() { return statusId == 6; }
        public boolean isRuntimeError() { return statusId >= 7 && statusId <= 12; }
    }
}
