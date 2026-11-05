package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.BadgeRepository;
import com.carbontrack.backend.repository.UserBadgeRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public BadgeController(
            BadgeRepository badgeRepository,
            UserBadgeRepository userBadgeRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    // List all available badges
    @GetMapping
    public ResponseEntity<?> getAllBadges() {
        List<Badge> badges = badgeRepository.findAll();
        return ResponseEntity.ok(badges);
    }

    // List earned badges for authenticated user and dynamically evaluate eligibility
    @GetMapping("/mine")
    public ResponseEntity<?> getMyBadges(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());
        List<Badge> allBadges = badgeRepository.findAll();
        Map<String, Badge> badgeByCode = allBadges.stream()
                .collect(Collectors.toMap(Badge::getCode, b -> b, (b1, b2) -> b1));

        List<UserBadge> currentEarned = userBadgeRepository.findByUserId(user.getId());
        Set<Short> earnedIds = currentEarned.stream()
                .map(UserBadge::getBadgeId)
                .collect(Collectors.toSet());

        // 1. Eco Pioneer: First activity logged
        if (!activities.isEmpty() && badgeByCode.containsKey("eco_pioneer")) {
            Badge b = badgeByCode.get("eco_pioneer");
            if (!earnedIds.contains(b.getId())) {
                UserBadge newBadge = new UserBadge(user.getId(), b.getId(), "first_activity_logged");
                userBadgeRepository.save(newBadge);
                earnedIds.add(b.getId());
                currentEarned.add(newBadge);
            }
        }

        // 2. Bike Buddy: Cycling or walking logged (activityTypeId 6 or 7)
        long bikeOrWalkActivities = activities.stream()
                .filter(a -> a.getActivityTypeId() == 6 || a.getActivityTypeId() == 7)
                .count();
        if (bikeOrWalkActivities >= 1 && badgeByCode.containsKey("bike_buddy")) {
            Badge b = badgeByCode.get("bike_buddy");
            if (!earnedIds.contains(b.getId())) {
                UserBadge newBadge = new UserBadge(user.getId(), b.getId(), "zero_emission_commute");
                userBadgeRepository.save(newBadge);
                earnedIds.add(b.getId());
                currentEarned.add(newBadge);
            }
        }

        // 3. Vegetarian Victor: Vegetarian or vegan meal (activityTypeId 16 or 17)
        long vegActivities = activities.stream()
                .filter(a -> a.getActivityTypeId() == 16 || a.getActivityTypeId() == 17)
                .count();
        if (vegActivities >= 1 && badgeByCode.containsKey("vegetarian_victor")) {
            Badge b = badgeByCode.get("vegetarian_victor");
            if (!earnedIds.contains(b.getId())) {
                UserBadge newBadge = new UserBadge(user.getId(), b.getId(), "sustainable_dining");
                userBadgeRepository.save(newBadge);
                earnedIds.add(b.getId());
                currentEarned.add(newBadge);
            }
        }

        // 4. Carbon Cutter: Logged 5+ activities showing commitment
        if (activities.size() >= 5 && badgeByCode.containsKey("carbon_cutter")) {
            Badge b = badgeByCode.get("carbon_cutter");
            if (!earnedIds.contains(b.getId())) {
                UserBadge newBadge = new UserBadge(user.getId(), b.getId(), "frequent_tracking_milestone");
                userBadgeRepository.save(newBadge);
                earnedIds.add(b.getId());
                currentEarned.add(newBadge);
            }
        }

        // Format user badges with badge details
        List<Map<String, Object>> response = currentEarned.stream().map(ub -> {
            Badge b = allBadges.stream()
                    .filter(badge -> badge.getId().equals(ub.getBadgeId()))
                    .findFirst()
                    .orElse(null);

            Map<String, Object> map = new HashMap<>();
            map.put("id", ub.getId());
            map.put("badgeId", ub.getBadgeId());
            map.put("earnedAt", ub.getEarnedAt());
            map.put("sourceEvent", ub.getSourceEvent());
            if (b != null) {
                map.put("code", b.getCode());
                map.put("name", b.getName());
                map.put("description", b.getDescription());
                map.put("iconUrl", b.getIconUrl());
                map.put("badgeType", b.getBadgeType());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
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
