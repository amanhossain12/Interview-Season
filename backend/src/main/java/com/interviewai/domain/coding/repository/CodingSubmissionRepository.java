package com.interviewai.domain.coding.repository;

import com.interviewai.domain.coding.entity.CodingSubmission;
import com.interviewai.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CodingSubmissionRepository extends JpaRepository<CodingSubmission, UUID> {
    Page<CodingSubmission> findByUserOrderBySubmittedAtDesc(User user, Pageable pageable);
    List<CodingSubmission> findByUserAndChallengeIdOrderBySubmittedAtDesc(User user, UUID challengeId);
}
