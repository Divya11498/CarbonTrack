package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.Recommendation;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.AiRecommendationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final UserRepository userRepository;

    public RecommendationController(
            AiRecommendationService aiRecommendationService,
            UserRepository userRepository) {
        this.aiRecommendationService = aiRecommendationService;
        this.userRepository = userRepository;
    }

    /**
     * Get active and in-progress recommendations for the user.
     * Pass ?refresh=true to force AI regeneration.
     */
    @GetMapping
    public ResponseEntity<?> getRecommendations(
            @RequestParam(name = "refresh", defaultValue = "false") boolean refresh,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        List<Recommendation> list = aiRecommendationService.getRecommendations(user, refresh);
        return ResponseEntity.ok(list);
    }

    /**
     * Get completed recommendations history.
     */
    @GetMapping("/completed")
    public ResponseEntity<?> getCompletedRecommendations(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        List<Recommendation> completed = aiRecommendationService.getCompletedRecommendations(user);
        return ResponseEntity.ok(completed);
    }

    /**
     * Get synthesized AI Insights and high-level telemetry analysis.
     */
    @GetMapping("/insights")
    public ResponseEntity<?> getAiInsights(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        Map<String, Object> insights = aiRecommendationService.getAiInsights(user);
        return ResponseEntity.ok(insights);
    }

    /**
     * Force fresh AI recommendation generation.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> forceGenerate(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        List<Recommendation> fresh = aiRecommendationService.generateAndSaveRecommendations(user);
        return ResponseEntity.ok(fresh);
    }

    /**
     * Start a recommended action (sets status to IN_PROGRESS).
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<?> startRecommendation(
            @PathVariable("id") Long id,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        try {
            Recommendation updated = aiRecommendationService.startRecommendation(user, id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark a recommendation as completed and log actual carbon savings.
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeRecommendation(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        BigDecimal actualSavings = null;
        if (body != null && body.containsKey("actualSavings") && body.get("actualSavings") != null) {
            try {
                actualSavings = new BigDecimal(body.get("actualSavings").toString());
            } catch (Exception ignored) {
            }
        }

        try {
            Recommendation updated = aiRecommendationService.completeRecommendation(user, id, actualSavings);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Dismiss a recommendation.
     */
    @PostMapping("/{id}/dismiss")
    public ResponseEntity<?> dismissRecommendation(
            @PathVariable("id") Long id,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access."));
        }

        try {
            Recommendation updated = aiRecommendationService.dismissRecommendation(user, id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
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
