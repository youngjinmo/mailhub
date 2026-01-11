package com.emailrelay.service;

import com.emailrelay.dto.ParsedEmail;
import com.emailrelay.exception.CustomException.*;
import com.emailrelay.model.RelayEmail;
import com.emailrelay.repository.RelayEmailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailRelayService {

    @Value("${spring.application.domain}")
    private String serviceDomain;

    @Value("${spring.application.name}")
    private String serviceName;

    private final CacheService cacheService;
    private final RelayEmailRepository relayEmailRepository;
    private final S3EmailService s3EmailService;
    private final SESEmailService sesEmailService;

    @Transactional
    public String generateRelayEmailAddress(String primaryEmail) {
        String relayAddress;

        do {
            relayAddress = "hello" + serviceDomain;
        } while (relayEmailRepository.findByRelayAddress(relayAddress).isPresent());

        if (relayAddress.isBlank()) {
            throw new GenerateRelayEmailException();
        }

        log.info("Relay email address generated: {}", relayAddress);
        cacheService.setRelayEmail(primaryEmail, relayAddress);
        return relayAddress;
    }

    public String findPrimaryEmailByRelayEmail(String relayEmail) {
        RelayEmail entity = relayEmailRepository
                .findByRelayAddress(relayEmail)
                .orElseThrow();
        return entity.getPrimaryEmail();
    }

    /**
     * Forward email from S3 to primary email address
     * @param s3Key S3 object key where the email is stored
     */
    public void forwardEmail(String s3Key) {
        try {
            log.info("Starting email forwarding process for S3 key: {}", s3Key);

            // 1. Fetch and parse email from S3
            ParsedEmail parsedEmail = s3EmailService.fetchAndParseEmail(s3Key);
            log.info("Email parsed. From: {}, To: {}, Subject: {}",
                    parsedEmail.getFrom(), parsedEmail.getTo(), parsedEmail.getSubject());

            // 2. Extract relay email address (recipient)
            if (parsedEmail.getTo() == null || parsedEmail.getTo().isEmpty()) {
                log.error("No recipient found in parsed email");
                throw new EmailForwardException("No recipient found in email");
            }

            String relayEmail = parsedEmail.getTo().get(0);
            parsedEmail.setOriginalRecipient(relayEmail);

            // 3. Find primary email address mapped to relay address
            String primaryEmail = findPrimaryEmailByRelayEmail(relayEmail);
            log.info("Found primary email: {} for relay email: {}", primaryEmail, relayEmail);

            // 4. Forward email to primary address via SES
            sesEmailService.forwardParsedEmail(primaryEmail, parsedEmail);
            log.info("Email successfully forwarded from {} to {}", relayEmail, primaryEmail);

        } catch (Exception e) {
            log.error("Failed to forward email for S3 key: {}", s3Key, e);
            throw new EmailForwardException("Email forwarding failed: " + e.getMessage());
        }
    }
}
