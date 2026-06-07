package com.interviewai.domain.interview.repository;

import com.interviewai.domain.interview.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnswerRepository extends JpaRepository<Answer, UUID> {
    List<Answer> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
    Optional<Answer> findByQuestionId(UUID questionId);
    long countBySessionId(UUID sessionId);
}
