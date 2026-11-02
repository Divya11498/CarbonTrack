
package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.GoalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserRepository userRepository;

    public GoalController(
            GoalService goalService,
            UserRepository userRepository) {
        this.goalService = goalService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createGoal(
            @RequestBody Goal goal,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Goal savedGoal = goalService.createGoal(user.getId(), goal);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedGoal);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserGoals(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                goalService.getUserGoals(user.getId()));
    }

    @GetMapping("/{goalId}/progress")
    public ResponseEntity<?> getGoalProgress(
            @PathVariable Long goalId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            return ResponseEntity.ok(
                    goalService.getGoalProgress(user.getId(), goalId));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", exception.getMessage()));
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName())
                .orElse(null);
    }
}
