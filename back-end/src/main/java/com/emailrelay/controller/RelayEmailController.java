package com.emailrelay.controller;

import com.emailrelay.dto.ApiResponse;
import com.emailrelay.service.EmailRelayService;
import com.emailrelay.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/relay-emails")
@RequiredArgsConstructor
public class RelayEmailController {

    private final EmailRelayService emailRelayService;
    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<String>> createRelayEmail(String primaryEmail) {
        String relayEmail = emailRelayService.generateRelayEmailAddress(primaryEmail);
        return ResponseEntity.ok(ApiResponse.success(relayEmail));
    }

    @GetMapping("/find-primary-email")
    public ResponseEntity<ApiResponse<String>> findPrimaryEmail(@RequestParam String relayEmail) {
        String primaryEmail = emailRelayService.findPrimaryEmailByRelayEmail(relayEmail);
        return ResponseEntity.ok(ApiResponse.success(primaryEmail));
    }

    @PostMapping("/forward")
    public ResponseEntity<ApiResponse<Void>> forwardEmail(@RequestParam String relayEmail) {
        emailRelayService.forwardEmail(relayEmail);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
