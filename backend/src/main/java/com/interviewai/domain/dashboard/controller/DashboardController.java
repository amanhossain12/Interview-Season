package com.interviewai.domain.dashboard.controller;

import com.interviewai.domain.interview.repository.InterviewSessionRepository;
import com.interviewai.domain.resume.repository.ResumeRepository;
import com.interviewai.domain.user.entity.User;
import com.interviewai.domain.user.repository.UserRepository;
import com.interviewai.shared.exception.ResourceNotFoundException;
import com.interviewai.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "User dashboard statistics")
public class DashboardController {

    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ResumeRepository resumeRepository;

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics for current user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(userDetails.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));

        long totalInterviews = sessionRepository.countCompletedByUser(user);
        Double avgScore = sessionRepository.findAverageScoreByUser(user);
        long totalResumes = resumeRepository.countByUser(user);

        var recentSessions = sessionRepository.findTop5ByUserAndStatusOrderByCreatedAtDesc(user, "COMPLETED");

        Map<String, Object> stats = Map.of(
            "totalInterviews", totalInterviews,
            "averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0,
            "totalResumes", totalResumes,
            "recentSessions", recentSessions
        );

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/progress")
    @Operation(summary = "Get weekly progress data")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWeeklyProgress(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(userDetails.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));

        OffsetDateTime since = OffsetDateTime.now().minusDays(28);
        var sessions = sessionRepository.findByUserSince(user, since);

        // Group by week
        Map<String, Integer> weeklyCount = new LinkedHashMap<>();
        for (int i = 3; i >= 0; i--) {
            OffsetDateTime weekStart = OffsetDateTime.now().minusWeeks(i).withHour(0).withMinute(0);
            String label = "Week " + (4 - i);
            weeklyCount.put(label, 0);
        }

        sessions.forEach(session -> {
            int weeksAgo = (int) java.time.temporal.ChronoUnit.WEEKS.between(
                session.getCreatedAt().toLocalDate(), OffsetDateTime.now().toLocalDate());
            String label = "Week " + (4 - Math.min(weeksAgo, 3));
            weeklyCount.merge(label, 1, Integer::sum);
        });

        List<Map<String, Object>> progress = new ArrayList<>();
        weeklyCount.forEach((week, count) ->
            progress.add(Map.of("week", week, "interviews", count)));

        return ResponseEntity.ok(ApiResponse.success(progress));
    }
}
