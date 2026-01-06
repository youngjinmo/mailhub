package com.emailrelay.controller;

import com.emailrelay.dto.ApiResponse;
import com.emailrelay.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Check if username exists
     */
    @GetMapping("/exists/{username}")
    public ResponseEntity<ApiResponse<Boolean>> checkUsernameExists(@PathVariable String username) {
        boolean exists = userService.existsByUsername(username);

        return ResponseEntity.ok(ApiResponse.success(exists));
    }

    /**
     * Delete current user account (withdrawal)
     */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        userService.deleteUser(userId);

        log.info("User deleted: {}", userId);

        return ResponseEntity.ok(ApiResponse.success());
    }
}
