package com.interviewai.domain.user.repository;

import com.interviewai.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByGoogleIdAndDeletedAtIsNull(String googleId);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.active = true ORDER BY u.createdAt DESC")
    Page<User> findAllActiveUsers(Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL")
    long countActiveUsers();
}
