package com.emailrelay.service;

import com.emailrelay.exception.CustomException.*;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(to);
            helper.setSubject(title);
            helper.setText(content, true);

            mailSender.send(mimeMessage);
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
               <html>
               <body style="font-family: Arial, sans-serif;">
               <p>Email Relay Verification Code</p>
               <div style="font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #333;">
               %s
               </div>
               <p>This code will expire in 5 minutes.</p>
               <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
               <p style="margin-top: 20px;">Welcome aboard,<br>Email Digest Team.</p>
               </body>
               </html>
               """, code);
    }

    private String buildWelcomeEmailBody() {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p style="font-size: 18px;">Welcome! 👋</p>
            
            <p>Thanks for signing up.</p>
            
            <p>You can now create private email addresses and safely receive forwarded emails—keeping your real inbox protected from spam and unwanted tracking.</p>
            
            <p>If you have any questions or feedback, we're always here to help.</p>
            
            <p style="margin-top: 20px;">Welcome aboard,<br>Email Digest Team.</p>
            </body>
            </html>
            """);
    }
}
