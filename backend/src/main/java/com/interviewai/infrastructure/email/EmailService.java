package com.interviewai.infrastructure.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String toEmail, String firstName, String verifyLink) {
        String subject = "Verify your InterviewAI account";
        String name = firstName != null ? firstName : "there";
        String html = """
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0f0f0f; color: #fff; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">InterviewAI</h1>
                <p style="color: #888; margin-top: 8px;">AI-Powered Interview Preparation</p>
              </div>
              <h2 style="color: #fff; font-size: 22px;">Hey %s! 👋</h2>
              <p style="color: #ccc; line-height: 1.6;">Welcome to InterviewAI! Please verify your email address to get started with AI-powered interview preparation.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="%s" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">Verify Email Address</a>
              </div>
              <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            </div>
            """.formatted(name, verifyLink);

        sendHtmlEmail(toEmail, subject, html);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetLink) {
        String subject = "Reset your InterviewAI password";
        String name = firstName != null ? firstName : "there";
        String html = """
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0f0f0f; color: #fff; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">InterviewAI</h1>
              </div>
              <h2 style="color: #fff; font-size: 22px;">Password Reset Request</h2>
              <p style="color: #ccc; line-height: 1.6;">Hi %s, we received a request to reset your password. Click the button below to set a new password.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="%s" style="background: linear-gradient(135deg, #dc2626, #9f1239); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 14px;">This link expires in 2 hours. If you didn't request a password reset, please ignore this email.</p>
            </div>
            """.formatted(name, resetLink);

        sendHtmlEmail(toEmail, subject, html);
    }

    @Async
    public void sendInterviewCompleteEmail(String toEmail, String firstName, String reportUrl, double score) {
        String subject = "Your InterviewAI Report is Ready!";
        String name = firstName != null ? firstName : "there";
        String html = """
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0f0f0f; color: #fff; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">InterviewAI</h1>
              </div>
              <h2 style="color: #fff; font-size: 22px;">Great job, %s! 🎉</h2>
              <p style="color: #ccc; line-height: 1.6;">Your mock interview is complete. Your overall score is <strong style="color: #7c3aed;">%.1f%%</strong>.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="%s" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">View Full Report</a>
              </div>
            </div>
            """.formatted(name, score, reportUrl);

        sendHtmlEmail(toEmail, subject, html);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("InterviewAI <" + fromEmail + ">");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
