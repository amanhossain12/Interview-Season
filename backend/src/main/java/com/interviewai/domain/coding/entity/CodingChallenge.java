package com.interviewai.domain.coding.entity;

import com.interviewai.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "coding_challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CodingChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "difficulty", columnDefinition = "difficulty_level")
    @Builder.Default
    private String difficulty = "MEDIUM";

    @Column(name = "category")
    private String category;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "constraints", columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "examples", columnDefinition = "jsonb")
    private String examples;

    @Column(name = "test_cases", nullable = false, columnDefinition = "jsonb")
    private String testCases;

    @Column(name = "starter_code", columnDefinition = "jsonb")
    private String starterCode;

    @Column(name = "solution_code", columnDefinition = "jsonb")
    private String solutionCode;

    @Column(name = "time_limit_ms")
    @Builder.Default
    private Integer timeLimitMs = 2000;

    @Column(name = "memory_limit_mb")
    @Builder.Default
    private Integer memoryLimitMb = 256;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
