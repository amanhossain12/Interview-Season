package com.interviewai.domain.interview.repository;

import com.interviewai.domain.interview.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
    List<Feedback> findBySessionId(UUID sessionId);
    Optional<Feedback> findByAnswerId(UUID answerId);
}
