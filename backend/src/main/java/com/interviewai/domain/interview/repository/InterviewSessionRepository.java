package com.interviewai.domain.interview.repository;

import com.interviewai.domain.interview.entity.InterviewSession;
import com.interviewai.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {

    Page<InterviewSession> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Optional<InterviewSession> findByIdAndUser(UUID id, User user);

    List<InterviewSession> findTop5ByUserAndStatusOrderByCreatedAtDesc(User user, String status);

    @Query("SELECT COUNT(s) FROM InterviewSession s WHERE s.user = :user AND s.status = 'COMPLETED'")
    long countCompletedByUser(User user);

    @Query("SELECT AVG(f.overallScore) FROM Feedback f WHERE f.session.user = :user")
    Double findAverageScoreByUser(User user);

    @Query("SELECT s FROM InterviewSession s WHERE s.user = :user AND s.createdAt >= :since ORDER BY s.createdAt ASC")
    List<InterviewSession> findByUserSince(User user, OffsetDateTime since);

    long countByStatus(String status);
}
