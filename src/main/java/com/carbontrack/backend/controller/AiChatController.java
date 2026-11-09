package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.AiChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/chat")
public class AiChatController {

    private final AiChatService aiChatService;
    private final UserRepository userRepository;

    public AiChatController(AiChatService aiChatService, UserRepository userRepository) {
        this.aiChatService = aiChatService;
        this.userRepository = userRepository;
    }

    public record ChatRequest(
            String message,
            String context,
            List<Map<String, String>> history
    ) {}

    @PostMapping
    public ResponseEntity<?> handleChat(
            @RequestBody ChatRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access. Please sign in to chat with CarbonTrack AI."));
        }

        if (request == null || request.message() == null || request.message().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty."));
        }

        try {
            Map<String, Object> result = aiChatService.processChat(
                    user,
                    request.message().trim(),
                    request.context(),
                    request.history()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to process AI chat: " + e.getMessage()));
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName())
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .orElse(null);
    }
}
