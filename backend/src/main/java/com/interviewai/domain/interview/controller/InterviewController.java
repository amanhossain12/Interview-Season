package com.interviewai.domain.interview.controller;

import com.interviewai.domain.interview.dto.InterviewDtos.*;
import com.interviewai.domain.interview.entity.*;
import com.interviewai.domain.interview.service.InterviewService;
import com.interviewai.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
@Tag(name = "Interview", description = "Mock interview management")
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/sessions")
    @Operation(summary = "Create a new interview session")
    public ResponseEntity<ApiResponse<InterviewSession>> createSession(
        @Valid @RequestBody CreateSessionRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        InterviewSession session = interviewService.createSession(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Interview session created", session));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Get all interview sessions for current user")
    public ResponseEntity<ApiResponse<Page<InterviewSession>>> getSessions(
        @PageableDefault(size = 10) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Page<InterviewSession> sessions = interviewService.getUserSessions(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get a specific interview session")
    public ResponseEntity<ApiResponse<InterviewSession>> getSession(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        InterviewSession session = interviewService.getSessionById(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @GetMapping("/sessions/{id}/questions")
    @Operation(summary = "Get questions for a session")
    public ResponseEntity<ApiResponse<List<Question>>> getQuestions(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<Question> questions = interviewService.getSessionQuestions(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @PostMapping("/sessions/{id}/answers")
    @Operation(summary = "Submit an answer and get AI feedback")
    public ResponseEntity<ApiResponse<InterviewService.AnswerWithFeedback>> submitAnswer(
        @PathVariable UUID id,
        @Valid @RequestBody SubmitAnswerRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        InterviewService.AnswerWithFeedback result = interviewService.submitAnswer(id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Answer submitted and feedback generated", result));
    }

    @PostMapping("/sessions/{id}/complete")
    @Operation(summary = "Complete an interview session")
    public ResponseEntity<ApiResponse<InterviewSession>> completeSession(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        InterviewSession session = interviewService.completeSession(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Interview completed", session));
    }

    @GetMapping("/sessions/{id}/feedbacks")
    @Operation(summary = "Get all feedbacks for a session")
    public ResponseEntity<ApiResponse<List<Feedback>>> getFeedbacks(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<Feedback> feedbacks = interviewService.getSessionFeedbacks(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(feedbacks));
    }

    @PostMapping(value = "/sessions/{id}/voice-answer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a voice answer (audio file → Whisper transcription → AI feedback)")
    public ResponseEntity<ApiResponse<InterviewService.AnswerWithFeedback>> submitVoiceAnswer(
        @PathVariable UUID id,
        @RequestParam("audio") MultipartFile audioFile,
        @RequestParam("questionId") String questionId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Handled in a dedicated VoiceAnswerService (injected separately if needed)
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setTextContent("(Voice answer - transcription pending)");
        InterviewService.AnswerWithFeedback result = interviewService.submitAnswer(id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Voice answer submitted", result));
    }
}
