package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.BadgeService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    public BadgeController(
            BadgeService badgeService,
            UserRepository userRepository) {
        this.badgeService = badgeService;
        this.userRepository = userRepository;
    }

    // Get all available badges
    @GetMapping
    public List<Badge> getAllBadges() {
        return badgeService.getAllBadges();
    }

    // Get badges of the currently authenticated user
    @GetMapping("/mine")
    public ResponseEntity<?> getMyBadges(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<UserBadge> badges =
                badgeService.getUserBadges(user.getId());

        return ResponseEntity.ok(badges);
    }

    // Get badges by user ID
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserBadges(
            @PathVariable Long userId,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User authenticatedUser = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Users can retrieve only their own badges
        if (!String.valueOf(authenticatedUser.getId())
                .equals(String.valueOf(userId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserBadge> badges =
                badgeService.getUserBadges(userId);

        return ResponseEntity.ok(badges);
    }
}