package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    public LeaderboardController(
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository) {
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping
    public ResponseEntity<?> getLeaderboard(
            @RequestParam(defaultValue = "month") String period,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        List<User> users = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .collect(Collectors.toList());

        List<ActivityLog> allActivities = activityLogRepository.findAll();
        LocalDate today = LocalDate.now();

        LocalDate filterDate;
        if ("week".equalsIgnoreCase(period)) {
            filterDate = today.minusDays(7);
        } else if ("year".equalsIgnoreCase(period)) {
            filterDate = today.withDayOfYear(1);
        } else {
            // Default month
            filterDate = today.withDayOfMonth(1);
        }

        // Calculate emissions per user
        List<Map<String, Object>> entries = new ArrayList<>();

        for (User u : users) {
            List<ActivityLog> userActs = allActivities.stream()
                    .filter(a -> u.getId().equals(a.getUserId()))
                    .filter(a -> a.getLogDate() != null && !a.getLogDate().isBefore(filterDate))
                    .collect(Collectors.toList());

            BigDecimal emissions = userActs.stream()
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Compute score (lower emissions + consistent logging = higher score)
            double emVal = emissions.doubleValue();
            int score;
            if (userActs.isEmpty()) {
                score = 70;
            } else if (emVal <= 25.0) {
                score = 98;
            } else if (emVal <= 50.0) {
                score = 91;
            } else if (emVal <= 100.0) {
                score = 82;
            } else if (emVal <= 150.0) {
                score = 73;
            } else {
                score = Math.max(30, 65 - (int) ((emVal - 150) / 10));
            }

            String strength = determineTopCategory(userActs);

            Map<String, Object> entry = new HashMap<>();
            entry.put("userId", u.getId());
            entry.put("name", u.getDisplayName() != null ? u.getDisplayName() : "Eco Member");
            entry.put("avatarUrl", u.getAvatarUrl());
            entry.put("emissions", emissions.setScale(1, RoundingMode.HALF_UP));
            entry.put("score", score);
            entry.put("activityCount", userActs.size());
            entry.put("strength", strength);
            entry.put("isCurrentUser", currentUser != null && u.getId().equals(currentUser.getId()));
            entries.add(entry);
        }

        // Sort by lowest emissions (or highest score)
        entries.sort((a, b) -> {
            int scoreComp = Integer.compare((int) b.get("score"), (int) a.get("score"));
            if (scoreComp != 0) return scoreComp;
            BigDecimal emA = (BigDecimal) a.get("emissions");
            BigDecimal emB = (BigDecimal) b.get("emissions");
            return emA.compareTo(emB);
        });

        // Assign ranks
        int currentUserRank = -1;
        for (int i = 0; i < entries.size(); i++) {
            int rank = i + 1;
            entries.get(i).put("rank", rank);
            if (Boolean.TRUE.equals(entries.get(i).get("isCurrentUser"))) {
                currentUserRank = rank;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("currentUserRank", currentUserRank);
        result.put("totalParticipants", entries.size());
        result.put("leaderboard", entries);

        return ResponseEntity.ok(result);
    }

    private String determineTopCategory(List<ActivityLog> acts) {
        if (acts.isEmpty()) return "General";
        Map<Short, Long> counts = acts.stream()
                .collect(Collectors.groupingBy(ActivityLog::getCategoryId, Collectors.counting()));
        Short topCat = counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse((short) 1);

        return switch (topCat) {
            case 1 -> "Transport";
            case 2 -> "Electricity";
            case 3 -> "Food";
            case 4 -> "Shopping";
            default -> "Lifestyle";
        };
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
