package com.interviewai.domain.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "audio_url", length = 1000)
    private String audioUrl;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "duration_seconds")
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "word_count")
    @Builder.Default
    private Integer wordCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
