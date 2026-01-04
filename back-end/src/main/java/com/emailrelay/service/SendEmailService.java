package com.emailrelay.service;

import com.emailrelay.exception.CustomException.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SendEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.application.name}")
    private String serviceName;

    public void sendVerificationCode(String to, String code) {
        try {
            String title = "[" + serviceName + "] Verification Code";
            sendEmail(to, title, buildVerificationEmailBody(code));
            log.info("Verification email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", to, e);
            throw new EmailSendException(e.getMessage());
        }
    }

    public void sendWelcomeEmail(String to) {
        try {
            String title = "[" + serviceName + "] Welcome to Email";
            sendEmail(to, title, buildWelcomeEmailBody());
            log.info("Welcome email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", to, e);
            throw new EmailSendException(e.getMessage());
        }
    }

    /**
     * Send email with custom title and content
     */
    public void sendEmail(String to, String title, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(title);
            message.setText(content);

            mailSender.send(message);
            log.info("Email sent to: {} with title: {}", to, title);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
            throw new EmailSendException(e.getMessage());
        }
    }

    /**
     * Send email with service name prefix in title
     */
    public void sendEmailWithPrefix(String to, String title, String content) {
        String prefixedTitle = "[" + serviceName + "] " + title;
        sendEmail(to, prefixedTitle, content);
    }

    private String buildVerificationEmailBody(String code) {
        return String.format("""
                Email Relay Verification Code

                %s

                This code will expire in 5 minutes.

                If you didn't request this code, please ignore this email.

                """, code);
    }

    private String buildWelcomeEmailBody() {
        return String.format("""
                Welcome! 👋
                
                Thanks for signing up.
                
                You can now create private email addresses and safely receive forwarded emails—keeping your real inbox protected from spam and unwanted tracking.
                
                If you have any questions or feedback, we’re always here to help.
                
                Welcome aboard,
                Email Digest Team.
                """);
    }
}
