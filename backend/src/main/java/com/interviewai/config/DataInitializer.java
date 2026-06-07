package com.interviewai.config;

import com.interviewai.domain.user.entity.Role;
import com.interviewai.domain.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds required reference data on startup.
 * Idempotent — safe to run every time.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        seedRoles();
    }

    private void seedRoles() {
        List<String> requiredRoles = List.of("ROLE_CANDIDATE", "ROLE_ADMIN");

        for (String roleName : requiredRoles) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = Role.builder().name(roleName).build();
                roleRepository.save(role);
                log.info("Created role: {}", roleName);
            }
        }

        log.info("Roles seeded successfully");
    }
}
