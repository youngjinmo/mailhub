package com.emailrelay.service;

import com.emailrelay.dto.AuthToken;
import com.emailrelay.exception.CustomException;
import com.emailrelay.security.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final CacheService cacheService;
    private final SendEmailService sendEmailService;
    private final TokenService tokenService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${verification.code.expiration}")
    private Long codeExpiration;

    @Value("${verification.code.max-attempts}")
    private Integer maxAttempts;

    private static final String CODE_PREFIX = "auth:verification:code:";
    private static final String ATTEMPT_PREFIX = "auth:verification:attempt:";
    private static final String RATE_LIMIT_PREFIX = "verification:ratelimit:";
    private static final String REFRESH_TOKEN_PREFIX = "auth:refresh:token:";

    public String sendVerificationCode(String email) {
        String code = generateCode();
        String key = CODE_PREFIX + email + ":";
        String attemptKey = ATTEMPT_PREFIX + email + ":";

        cacheService.setRaw(key, code, codeExpiration, TimeUnit.MILLISECONDS);
        cacheService.setRaw(attemptKey, 0, codeExpiration, TimeUnit.MILLISECONDS);

        sendEmailService.sendVerificationCode(email, code);
        log.info("Verification code sent to {}", email);

        return code;
    }

    public boolean verifyCode(String email, String code) {
        String key = CODE_PREFIX + email + ":";
        String attemptKey = ATTEMPT_PREFIX + email + ":";

        Integer attempts = (Integer) cacheService.getRaw(attemptKey);
        if (attempts != null && attempts >= maxAttempts) {
            log.warn("Max verification attempts exceeded for {}", email);
            throw new CustomException.TooManyAttemptsException();
        }

        String storedCode = (String) cacheService.getRaw(key);
        if (storedCode == null) {
            log.warn("Verification code not found or expired for {}", email);
            throw new CustomException.InvalidVerificationCodeException();
        }

        if (!storedCode.equals(code)) {
            cacheService.incrementRaw(attemptKey);
            log.warn("Invalid verification code for {}", email);
            throw new CustomException.InvalidVerificationCodeException();
        }

        cacheService.deleteRaw(key);
        cacheService.deleteRaw(attemptKey);

        log.info("Verification successful for {}", email);
        return true;
    }

    public AuthToken generateTokens(Long userId, String username) {
        try {
            String accessToken = tokenService.generateAccessToken(userId, username);
            String refreshToken = tokenService.generateRefreshToken(userId, username);
            return new AuthToken(accessToken, refreshToken);
        } catch (Exception e) {
            throw new RuntimeException("Failed to grant auth tokens");
        }
    }

    public Long getAccessTokenTTL() {
        return tokenService.getAccessTokenExpiration();
    }

    public Long getRefreshTokenTTL() {
        return tokenService.getRefreshTokenExpiration();
    }

    public boolean validateToken(String token) {
        return tokenService.validateToken(token);
    }

    public Long getUserIdFromToken(String token) {
        return tokenService.getUserIdFromToken(token);
    }

    public String getUsernameFromToken(String token) {
        return tokenService.getUsernameFromToken(token);
    }

    public String generateAccessToken(Long userId, String username) {
        return tokenService.generateAccessToken(userId, username);
    }

    public void storeRefreshToken(Long userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        cacheService.setRaw(key, refreshToken, getRefreshTokenTTL(), TimeUnit.MILLISECONDS);
        log.info("Stored refresh token for user: {}", userId);
    }

    public boolean validateRefreshTokenInCache(Long userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        String storedToken = (String) cacheService.getRaw(key);
        return storedToken != null && storedToken.equals(refreshToken);
    }

    public void removeRefreshToken(Long userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        cacheService.deleteRaw(key);
        log.info("Removed refresh token for user: {}", userId);
    }

    private String generateCode() {
        return String.format("%06d", secureRandom.nextInt(1000000));
    }
}
