package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.service.BadgeService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping
    public List<Badge> getAllBadges() {
        return badgeService.getAllBadges();
    }

    @GetMapping("/users/{userId}")
    public List<UserBadge> getUserBadges(
            @PathVariable Long userId) {

        return badgeService.getUserBadges(userId);
    }
}