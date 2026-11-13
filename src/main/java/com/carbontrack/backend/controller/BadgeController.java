package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.BadgeRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.AchievementEvaluationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;
    private final AchievementEvaluationService achievementEvaluationService;

    public BadgeController(
            BadgeRepository badgeRepository,
            UserRepository userRepository,
            AchievementEvaluationService achievementEvaluationService) {
        this.badgeRepository = badgeRepository;
        this.userRepository = userRepository;
        this.achievementEvaluationService = achievementEvaluationService;
    }

    @GetMapping
    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyBadges(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(achievementEvaluationService.getUserBadgesWithProgress(user.getId()));
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
