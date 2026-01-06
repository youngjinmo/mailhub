package com.emailrelay.controller;

import com.emailrelay.dto.ApiResponse;
import com.emailrelay.dto.AuthToken;
import com.emailrelay.service.AuthService;
import com.emailrelay.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    /**
     * 회원가입/로그인을 위한 인증코드 발송
     * @param username
     * @return
     */
    @PostMapping("/send-verification-code")
    public ResponseEntity<ApiResponse<Void>> sendVerificationCode(@RequestParam String username) {
        authService.sendVerificationCode(username);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 인증코드 유효성 검증
     * @param username
     * @param code
     * @return
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> verifyCodeToLogin(HttpServletResponse response, @RequestParam String username, @RequestParam String code) {
        if (!userService.existsByUsername(username)) {
            userService.createEmailUser(username);
        }
        boolean result = authService.verifyCode(username, code);
        if (result) {
            AuthToken authToken = userService.login(username);

            Long userId = authService.getUserIdFromToken(authToken.accessToken());

            // Set authentication in SecurityContext
            UsernamePasswordAuthenticationToken authentication
                    = new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.info("User logged in : {}", username);

            setTokenCookie(response, authToken.refreshToken(), authService.getRefreshTokenTTL());
            return ResponseEntity.ok(ApiResponse.success(authToken.accessToken()));
        }
        return ResponseEntity.ok(ApiResponse.fail("Wrong code"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<String>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        // get access token from request header
        String accessToken = extractTokenFromHeader(request);

        // verify access token
        if (accessToken != null && authService.validateToken(accessToken)) {
            // if it is valid, return.
            return ResponseEntity.ok(ApiResponse.success(accessToken));
        }

        // it is invalid or not exists token, get refresh token from http only cookies
        String refreshToken = extractTokenFromCookie(request);

        if (refreshToken == null || !authService.validateToken(refreshToken)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("Required login"));
        }

        // grant access token and return it
        Long userId = authService.getUserIdFromToken(refreshToken);
        String username = authService.getUsernameFromToken(refreshToken);

        // Validate refresh token exists in Redis
        if (!authService.validateRefreshTokenInCache(userId, refreshToken)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("Required login"));
        }

        String newAccessToken = authService.generateAccessToken(userId, username);

        return ResponseEntity.ok(ApiResponse.success(newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractTokenFromCookie(request);

        if (refreshToken != null && authService.validateToken(refreshToken)) {
            try {
                Long userId = authService.getUserIdFromToken(refreshToken);
                authService.removeRefreshToken(userId);
                SecurityContextHolder.clearContext();
            } catch (Exception e) {
                log.warn("Failed to remove refresh token from cache", e);
            }
        }

        // Clear refresh token cookie
        clearTokenCookie(response);

        return ResponseEntity.ok(ApiResponse.success());
    }

    private String extractTokenFromHeader(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setTokenCookie(HttpServletResponse response, String token, Long ttl) {
        response.addHeader("Set-Cookie",
                "refreshToken=" + token +
                        "; Path=/" +
                        "; HttpOnly" +
                        "; Secure" +
                        "; SameSite=Strict" +
                        "; Max-Age=" + (ttl));
        // (7 * 24 * 60 * 60)); // 7일
    }

    private void clearTokenCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                "refreshToken=" +
                        "; Path=/" +
                        "; HttpOnly" +
                        "; Secure" +
                        "; SameSite=Strict" +
                        "; Max-Age=0");
    }
}
