package com.interviewai.domain.user.service;

import com.interviewai.domain.user.dto.AuthDtos.*;
import com.interviewai.domain.user.entity.*;
import com.interviewai.domain.user.repository.*;
import com.interviewai.infrastructure.email.EmailService;
import com.interviewai.security.JwtTokenProvider;
import com.interviewai.shared.exception.BadRequestException;
import com.interviewai.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role candidateRole = roleRepository.findByName("ROLE_CANDIDATE")
            .orElseThrow(() -> new RuntimeException("Default role not found"));

        User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(candidateRole)
            .emailVerified(false)
            .active(true)
            .build();

        user = userRepository.save(user);

        // Attempt to send verification email — non-fatal if email is not configured
        try {
            sendVerificationEmail(user);
        } catch (Exception e) {
            log.warn("Could not send verification email to {}: {}", user.getEmail(), e.getMessage());
        }

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository
            .findByTokenAndRevokedFalse(request.getRefreshToken())
            .orElseThrow(() -> new BadRequestException("Invalid or expired refresh token"));

        if (refreshToken.isExpired()) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BadRequestException("Refresh token expired. Please login again.");
        }

        User user = refreshToken.getUser();
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user);
    }

    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByTokenAndRevokedFalse(refreshTokenValue)
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailAndDeletedAtIsNull(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(OffsetDateTime.now().plusHours(2))
                .used(false)
                .build();
            passwordResetTokenRepository.save(resetToken);

            String resetLink = frontendUrl + "/reset-password?token=" + token;
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
            .findByTokenAndUsedFalse(request.getToken())
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.revokeAllUserTokens(user);
    }

    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = verificationTokenRepository
            .findByTokenAndUsedFalse(token)
            .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        if (verificationToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);
    }

    private void sendVerificationEmail(User user) {
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
            .token(token)
            .user(user)
            .expiresAt(OffsetDateTime.now().plusHours(24))
            .used(false)
            .build();
        verificationTokenRepository.save(verificationToken);

        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), verifyLink);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(userDetails);

        RefreshToken refreshToken = RefreshToken.builder()
            .token(refreshTokenValue)
            .user(user)
            .expiresAt(OffsetDateTime.now().plus(jwtTokenProvider.getRefreshExpiryMs(), ChronoUnit.MILLIS))
            .build();
        refreshTokenRepository.save(refreshToken);

        UserDto userDto = new UserDto();
        userDto.setId(user.getId().toString());
        userDto.setEmail(user.getEmail());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        userDto.setAvatarUrl(user.getAvatarUrl());
        userDto.setRole(user.getRole().getName());
        userDto.setEmailVerified(user.isEmailVerified());

        return new AuthResponse(accessToken, refreshTokenValue, jwtTokenProvider.getExpiryMs(), userDto);
    }
}
