package com.interviewai.infrastructure.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@Slf4j
@RequiredArgsConstructor
public class WhisperClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.base-url}")
    private String baseUrl;

    @Value("${openai.whisper-model}")
    private String whisperModel;

    public String transcribeAudio(byte[] audioData, String filename) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            ByteArrayResource audioResource = new ByteArrayResource(audioData) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "recording.webm";
                }
            };

            body.add("file", audioResource);
            body.add("model", whisperModel);
            body.add("language", "en");
            body.add("response_format", "text");

            WebClient client = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();

            String transcript = client.post()
                .uri("/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();

            log.info("Whisper transcription completed, length: {}", transcript != null ? transcript.length() : 0);
            return transcript != null ? transcript.trim() : "";
        } catch (Exception e) {
            log.error("Whisper transcription failed: {}", e.getMessage());
            throw new RuntimeException("Speech-to-text service temporarily unavailable", e);
        }
    }
}
