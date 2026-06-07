package com.interviewai.domain.resume.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "resume_analyses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    private Resume resume;

    @Column(name = "quality_score")
    @Builder.Default
    private Integer qualityScore = 0;

    @Column(name = "ats_score")
    @Builder.Default
    private Integer atsScore = 0;

    // Stored as comma-separated TEXT for H2/PostgreSQL compatibility
    @Column(name = "missing_sections", columnDefinition = "TEXT")
    private String missingSections;

    @Column(name = "keyword_analysis", columnDefinition = "TEXT")
    private String keywordAnalysis;

    @Column(name = "improvement_suggestions", columnDefinition = "TEXT")
    private String improvementSuggestions;

    // Stored as comma-separated TEXT for H2/PostgreSQL compatibility
    @Column(name = "skills_found", columnDefinition = "TEXT")
    private String skillsFound;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
