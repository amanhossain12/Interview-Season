package com.interviewai.domain.coding.entity;

import com.interviewai.domain.interview.entity.InterviewSession;
import com.interviewai.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "coding_submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CodingSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private CodingChallenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private InterviewSession session;

    @Column(name = "code", nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(name = "language", nullable = false, length = 50)
    private String language;

    @Column(name = "language_id")
    private Integer languageId;

    @Column(name = "status", columnDefinition = "submission_status")
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "runtime_ms")
    private Integer runtimeMs;

    @Column(name = "memory_kb")
    private Integer memoryKb;

    @Column(name = "test_results", columnDefinition = "jsonb")
    private String testResults;

    @Column(name = "passed_tests")
    @Builder.Default
    private Integer passedTests = 0;

    @Column(name = "total_tests")
    @Builder.Default
    private Integer totalTests = 0;

    @Column(name = "ai_review", columnDefinition = "TEXT")
    private String aiReview;

    @Column(name = "complexity_analysis", columnDefinition = "jsonb")
    private String complexityAnalysis;

    @Column(name = "judge0_token")
    private String judge0Token;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private OffsetDateTime submittedAt;
}
