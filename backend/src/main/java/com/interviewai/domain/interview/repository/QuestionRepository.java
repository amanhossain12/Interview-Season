package com.interviewai.domain.interview.repository;

import com.interviewai.domain.interview.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findBySessionIdOrderByOrderIndexAsc(UUID sessionId);
    long countBySessionId(UUID sessionId);
}
