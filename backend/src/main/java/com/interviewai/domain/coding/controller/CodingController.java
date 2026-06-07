package com.interviewai.domain.coding.controller;

import com.interviewai.domain.coding.entity.CodingChallenge;
import com.interviewai.domain.coding.entity.CodingSubmission;
import com.interviewai.domain.coding.service.CodingService;
import com.interviewai.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/coding")
@RequiredArgsConstructor
@Tag(name = "Coding", description = "Coding challenges and submissions")
public class CodingController {

    private final CodingService codingService;

    @GetMapping("/challenges")
    @Operation(summary = "Get all coding challenges")
    public ResponseEntity<ApiResponse<Page<CodingChallenge>>> getChallenges(
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String category,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            codingService.getChallenges(difficulty, category, pageable)));
    }

    @GetMapping("/challenges/{id}")
    @Operation(summary = "Get a specific coding challenge")
    public ResponseEntity<ApiResponse<CodingChallenge>> getChallenge(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(codingService.getChallenge(id)));
    }

    @PostMapping("/challenges/{id}/run")
    @Operation(summary = "Run code against sample test cases")
    public ResponseEntity<ApiResponse<CodingSubmission>> runCode(
        @PathVariable UUID id,
        @RequestBody CodeRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        CodingSubmission result = codingService.runCode(id, request.getCode(), request.getLanguage(),
            request.getStdin(), userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Code executed", result));
    }

    @PostMapping("/challenges/{id}/submit")
    @Operation(summary = "Submit code against all test cases")
    public ResponseEntity<ApiResponse<CodingSubmission>> submitCode(
        @PathVariable UUID id,
        @RequestBody CodeRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        CodingSubmission result = codingService.submitCode(id, request.getCode(), request.getLanguage(),
            userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Code submitted", result));
    }

    @GetMapping("/submissions")
    @Operation(summary = "Get user submission history")
    public ResponseEntity<ApiResponse<Page<CodingSubmission>>> getSubmissions(
        @PageableDefault(size = 20) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            codingService.getUserSubmissions(userDetails.getUsername(), pageable)));
    }

    @Data
    public static class CodeRequest {
        @NotBlank
        private String code;
        @NotBlank
        private String language;
        private String stdin;
    }
}
