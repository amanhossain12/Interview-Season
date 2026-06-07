package com.interviewai.domain.admin.controller;

import com.interviewai.domain.interview.repository.InterviewSessionRepository;
import com.interviewai.domain.resume.repository.ResumeRepository;
import com.interviewai.domain.user.entity.User;
import com.interviewai.domain.user.repository.UserRepository;
import com.interviewai.shared.exception.ResourceNotFoundException;
import com.interviewai.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ResumeRepository resumeRepository;

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<ApiResponse<Page<User>>> listUsers(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAllActiveUsers(pageable)));
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Enable or disable a user")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
        @PathVariable UUID id,
        @RequestParam boolean active
    ) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(active);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User status updated", user));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Platform-wide analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        long totalUsers = userRepository.countActiveUsers();
        long totalInterviews = sessionRepository.countByStatus("COMPLETED");

        Map<String, Object> analytics = Map.of(
            "totalUsers", totalUsers,
            "totalInterviews", totalInterviews
        );

        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
