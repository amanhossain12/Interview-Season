package com.interviewai.domain.resume.repository;

import com.interviewai.domain.resume.entity.Resume;
import com.interviewai.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByUserOrderByCreatedAtDesc(User user);
    Optional<Resume> findByIdAndUser(UUID id, User user);
    long countByUser(User user);
}
