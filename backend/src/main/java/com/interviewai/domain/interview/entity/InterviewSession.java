package com.interviewai.domain.interview.entity;

import com.interviewai.domain.resume.entity.Resume;
import com.interviewai.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(name = "title")
    private String title;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "experience_level")
    private String experienceLevel;

    @Column(name = "interview_type", columnDefinition = "interview_type")
    @Builder.Default
    private String interviewType = "TEXT";

    @Column(name = "status", columnDefinition = "interview_status")
    @Builder.Default
    private String status = "CREATED";

    @Column(name = "total_questions")
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "answered_questions")
    @Builder.Default
    private Integer answeredQuestions = 0;

    @Column(name = "duration_seconds")
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
