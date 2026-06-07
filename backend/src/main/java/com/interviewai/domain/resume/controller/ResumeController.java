package com.interviewai.domain.resume.controller;

import com.interviewai.domain.resume.entity.Resume;
import com.interviewai.domain.resume.entity.ResumeAnalysis;
import com.interviewai.domain.resume.service.ResumeService;
import com.interviewai.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
@Tag(name = "Resume", description = "Resume upload and analysis")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a resume (PDF or DOCX)")
    public ResponseEntity<ApiResponse<Resume>> uploadResume(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Resume resume = resumeService.uploadResume(file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Resume uploaded and analysis started", resume));
    }

    @GetMapping
    @Operation(summary = "Get all resumes for current user")
    public ResponseEntity<ApiResponse<List<Resume>>> getResumes(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<Resume> resumes = resumeService.getUserResumes(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(resumes));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific resume")
    public ResponseEntity<ApiResponse<Resume>> getResume(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Resume resume = resumeService.getResumeById(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(resume));
    }

    @GetMapping("/{id}/analysis")
    @Operation(summary = "Get resume analysis")
    public ResponseEntity<ApiResponse<ResumeAnalysis>> getAnalysis(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        ResumeAnalysis analysis = resumeService.getResumeAnalysis(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(analysis));
    }
}
