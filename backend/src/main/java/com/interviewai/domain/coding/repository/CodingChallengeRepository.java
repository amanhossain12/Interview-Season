package com.interviewai.domain.coding.repository;

import com.interviewai.domain.coding.entity.CodingChallenge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CodingChallengeRepository extends JpaRepository<CodingChallenge, UUID> {
    Page<CodingChallenge> findByActiveTrueOrderByDifficultyAsc(Pageable pageable);
    Page<CodingChallenge> findByActiveTrueAndDifficultyOrderByCreatedAtDesc(String difficulty, Pageable pageable);
    Page<CodingChallenge> findByActiveTrueAndCategoryOrderByCreatedAtDesc(String category, Pageable pageable);
}
