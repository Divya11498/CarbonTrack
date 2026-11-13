package com.carbontrack.backend.controller;

import com.carbontrack.backend.config.CacheConfig;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.BadgeRepository;
import com.carbontrack.backend.repository.UserBadgeRepository;
import com.carbontrack.backend.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
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
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;

    public LeaderboardController(
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository,
            UserBadgeRepository userBadgeRepository,
            BadgeRepository badgeRepository) {
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.badgeRepository = badgeRepository;
    }

    @GetMapping
    @Cacheable(
            value = CacheConfig.CACHE_LEADERBOARD,
            key = "(#period == null ? 'month' : #period) + ':' + (#authentication != null ? #authentication.name : 'anon')"
    )
    public ResponseEntity<?> getLeaderboard(
            @RequestParam(defaultValue = "month") String period,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        List<User> users = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .toList();

        List<ActivityLog> allActivities = activityLogRepository.findAll();
        Map<Short, Badge> badgeMap = badgeRepository.findAll().stream()
                .collect(Collectors.toMap(Badge::getId, b -> b));
        Map<Long, List<UserBadge>> userBadgesMap = userBadgeRepository.findAll().stream()
                .collect(Collectors.groupingBy(UserBadge::getUserId));

        LocalDate today = LocalDate.now();
        LocalDate filterDate;
        if ("week".equalsIgnoreCase(period)) {
            filterDate = today.minusDays(7);
        } else if ("year".equalsIgnoreCase(period)) {
            filterDate = today.withDayOfYear(1);
        } else {
            filterDate = today.withDayOfMonth(1);
        }

        List<Map<String, Object>> entries = new ArrayList<>();
        for (User u : users) {
            List<ActivityLog> userActs = allActivities.stream()
                    .filter(a -> u.getId().equals(a.getUserId()))
                    .filter(a -> a.getLogDate() != null && !a.getLogDate().isBefore(filterDate))
                    .toList();

            BigDecimal emissions = userActs.stream()
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double emVal = emissions.doubleValue();
            int score;
            if (userActs.isEmpty()) {
                score = 60;
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
            List<UserBadge> ubs = userBadgesMap.getOrDefault(u.getId(), List.of());
            List<String> badgeNames = ubs.stream()
                    .map(ub -> badgeMap.get(ub.getBadgeId()))
                    .filter(Objects::nonNull)
                    .map(Badge::getName)
                    .limit(4)
                    .toList();

            boolean anonymized = Boolean.TRUE.equals(u.getLeaderboardAnonymized());
            String name = anonymized
                    ? "Eco Tracker #" + u.getId()
                    : (u.getDisplayName() != null && !u.getDisplayName().isBlank() ? u.getDisplayName() : "Eco Member #" + u.getId());

            String avatarUrl = u.getAvatarUrl();
            if (avatarUrl == null || avatarUrl.isBlank()) {
                String seed = u.getAvatarSeed() != null ? u.getAvatarSeed() : "ct-user-" + u.getId();
                avatarUrl = "https://blobatar.dev/avatar/" + seed + "?gen=2";
            }

            Map<String, Object> entry = new HashMap<>();
            entry.put("userId", u.getId());
            entry.put("name", name);
            entry.put("avatarUrl", avatarUrl);
            entry.put("avatarSeed", u.getAvatarSeed() != null ? u.getAvatarSeed() : "ct-user-" + u.getId());
            entry.put("emissions", emissions.setScale(1, RoundingMode.HALF_UP));
            entry.put("score", score);
            entry.put("activityCount", userActs.size());
            entry.put("strength", strength);
            entry.put("badgesCount", ubs.size());
            entry.put("badges", badgeNames);
            entry.put("anonymized", anonymized);
            entry.put("isCurrentUser", currentUser != null && u.getId().equals(currentUser.getId()));
            entries.add(entry);
        }

        // Prioritize active low-emission participants, then inactive baseline accounts
        entries.sort((a, b) -> {
            int scoreComp = Integer.compare((int) b.get("score"), (int) a.get("score"));
            if (scoreComp != 0) return scoreComp;
            BigDecimal emA = (BigDecimal) a.get("emissions");
            BigDecimal emB = (BigDecimal) b.get("emissions");
            return emA.compareTo(emB);
        });

        List<Map<String, Object>> top50 = entries.stream().limit(50).collect(Collectors.toList());
        int currentUserRank = -1;
        for (int i = 0; i < entries.size(); i++) {
            int rank = i + 1;
            entries.get(i).put("rank", rank);
            if (Boolean.TRUE.equals(entries.get(i).get("isCurrentUser"))) {
                currentUserRank = rank;
            }
        }

        int percentile = (currentUserRank > 0 && !entries.isEmpty())
                ? (int) Math.max(1, Math.round((currentUserRank * 100.0) / entries.size()))
                : 100;

        List<String> habitTips = buildHabitTips(currentUser, allActivities, filterDate);

        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("currentUserRank", currentUserRank);
        result.put("percentile", percentile);
        result.put("totalParticipants", entries.size());
        result.put("leaderboard", top50);
        result.put("habitTips", habitTips);

        return ResponseEntity.ok(result);
    }

    private List<String> buildHabitTips(User user, List<ActivityLog> all, LocalDate since) {
        if (user == null) {
            return List.of("Log daily trips and energy habits to climb the community ranking.");
        }
        Map<Short, BigDecimal> byCat = new HashMap<>();
        for (ActivityLog a : all) {
            if (user.getId().equals(a.getUserId()) && a.getLogDate() != null && !a.getLogDate().isBefore(since)) {
                byCat.merge(a.getCategoryId(), a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO, BigDecimal::add);
            }
        }
        if (byCat.isEmpty()) {
            return List.of(
                    "Log at least 3 activities this week to establish your baseline score.",
                    "Try swapping 1 solo car commute with public transit or cycling.",
                    "Track vegetarian or vegan meals to boost your diet sustainability score."
            );
        }
        Short topCat = byCat.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse((short) 1);

        return switch (topCat) {
            case 1 -> List.of(
                    "Transport is your top emission driver — replacing 20 km/week of car travel with rail saves ~2.5 kg CO2e/week.",
                    "Bundle errands into a single trip or carpool to cut solo mileage."
            );
            case 2 -> List.of(
                    "Electricity leads your footprint — shift heavy appliances off-peak and unplug standby chargers.",
                    "Switching a 10 kWh block to green tariff reduces grid intensity significantly."
            );
            case 3 -> List.of(
                    "Diet accounts for most of your emissions — swapping two beef meals for plant-based meals can save >25 kg CO2e/month."
            );
            case 4 -> List.of(
                    "Shopping leads your footprint — prioritizing repair and secondhand apparel avoids manufacturing emissions."
            );
            default -> List.of(
                    "Waste is your top contributor — diverting organics to compost and sorting recyclables reduces methane impact."
            );
        };
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
            case 5 -> "Waste";
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
