package com.interviewai.domain.resume.entity;

import com.interviewai.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "resumes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    // JSON stored as TEXT (works with both H2 and PostgreSQL)
    @Column(name = "extracted_json", columnDefinition = "TEXT")
    private String extractedJson;

    @Column(name = "ats_score")
    @Builder.Default
    private Integer atsScore = 0;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "UPLOADED";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
