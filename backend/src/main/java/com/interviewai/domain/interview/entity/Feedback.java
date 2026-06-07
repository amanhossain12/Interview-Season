package com.interviewai.domain.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "feedbacks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false, unique = true)
    private Answer answer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(name = "technical_score")
    @Builder.Default private Integer technicalScore = 0;

    @Column(name = "communication_score")
    @Builder.Default private Integer communicationScore = 0;

    @Column(name = "confidence_score")
    @Builder.Default private Integer confidenceScore = 0;

    @Column(name = "relevance_score")
    @Builder.Default private Integer relevanceScore = 0;

    @Column(name = "structure_score")
    @Builder.Default private Integer structureScore = 0;

    @Column(name = "problem_solving_score")
    @Builder.Default private Integer problemSolvingScore = 0;

    @Column(name = "overall_score")
    @Builder.Default private Integer overallScore = 0;

    // Stored as comma-separated string for H2/PostgreSQL compatibility
    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "suggested_answer", columnDefinition = "TEXT")
    private String suggestedAnswer;

    @Column(name = "detailed_feedback", columnDefinition = "TEXT")
    private String detailedFeedback;

    @Column(name = "ai_raw_response", columnDefinition = "TEXT")
    private String aiRawResponse;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
