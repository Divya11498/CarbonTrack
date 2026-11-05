package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserProfile;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.UserProfileRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    private static final Map<Short, String> CATEGORY_MAP = Map.of(
            (short) 1, "Transport",
            (short) 2, "Electricity",
            (short) 3, "Food",
            (short) 4, "Shopping",
            (short) 5, "Waste"
    );

    public AnalyticsController(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        int currentMonth = today.getMonthValue();

        BigDecimal totalCo2e = BigDecimal.ZERO;
        BigDecimal todayCo2e = BigDecimal.ZERO;
        BigDecimal monthlyCo2e = BigDecimal.ZERO;
        BigDecimal yearlyCo2e = BigDecimal.ZERO;

        for (ActivityLog act : activities) {
            BigDecimal co2 = act.getCo2eKg() != null ? act.getCo2eKg() : BigDecimal.ZERO;
            totalCo2e = totalCo2e.add(co2);

            LocalDate d = act.getLogDate();
            if (d != null) {
                if (d.equals(today)) {
                    todayCo2e = todayCo2e.add(co2);
                }
                if (d.getYear() == currentYear) {
                    yearlyCo2e = yearlyCo2e.add(co2);
                    if (d.getMonthValue() == currentMonth) {
                        monthlyCo2e = monthlyCo2e.add(co2);
                    }
                }
            }
        }

        BigDecimal monthlyTarget = userProfileRepository.findByUserId(user.getId())
                .map(UserProfile::getMonthlyTargetKgco2e)
                .orElse(new BigDecimal("200.00"));

        BigDecimal totalReduced = monthlyTarget.subtract(monthlyCo2e);
        if (totalReduced.compareTo(BigDecimal.ZERO) < 0) {
            totalReduced = BigDecimal.ZERO;
        }

        // Calculate dynamic sustainability score (0 - 100)
        // Baseline: 10 kg/day = 300 kg/month. If monthly <= 100 kg -> score 90-100; if <= 200 kg -> score 75-89; etc.
        double monthlyVal = monthlyCo2e.doubleValue();
        double targetVal = monthlyTarget.doubleValue() > 0 ? monthlyTarget.doubleValue() : 200.0;
        int score;
        if (activities.isEmpty()) {
            score = 85;
        } else if (monthlyVal <= targetVal * 0.5) {
            score = 96;
        } else if (monthlyVal <= targetVal * 0.8) {
            score = 88;
        } else if (monthlyVal <= targetVal) {
            score = 78;
        } else if (monthlyVal <= targetVal * 1.3) {
            score = 62;
        } else {
            score = Math.max(35, 50 - (int) ((monthlyVal - targetVal) / 10));
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCo2eKg", totalCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("todayCo2eKg", todayCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("monthlyCo2eKg", monthlyCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("yearlyCo2eKg", yearlyCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("monthlyTargetKg", monthlyTarget);
        summary.put("totalReducedKg", totalReduced.setScale(2, RoundingMode.HALF_UP));
        summary.put("sustainabilityScore", score);
        summary.put("activitiesCount", activities.size());

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/trends")
    public ResponseEntity<?> getTrends(
            @RequestParam(defaultValue = "month") String period,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> trendPoints = new ArrayList<>();
        Map<String, BigDecimal> categorySums = new HashMap<>();

        if ("week".equalsIgnoreCase(period)) {
            // Last 7 days
            for (int i = 6; i >= 0; i--) {
                LocalDate d = today.minusDays(i);
                BigDecimal daySum = activities.stream()
                        .filter(a -> d.equals(a.getLogDate()))
                        .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                trendPoints.add(Map.of(
                        "date", d.toString(),
                        "label", d.getDayOfWeek().toString().substring(0, 3),
                        "emissions", daySum.setScale(2, RoundingMode.HALF_UP)
                ));
            }
        } else if ("year".equalsIgnoreCase(period)) {
            // 12 months of current year
            int year = today.getYear();
            for (int m = 1; m <= 12; m++) {
                int monthNum = m;
                BigDecimal monthSum = activities.stream()
                        .filter(a -> a.getLogDate() != null && a.getLogDate().getYear() == year && a.getLogDate().getMonthValue() == monthNum)
                        .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                trendPoints.add(Map.of(
                        "date", year + "-" + String.format("%02d", monthNum),
                        "label", java.time.Month.of(monthNum).toString().substring(0, 3),
                        "emissions", monthSum.setScale(2, RoundingMode.HALF_UP)
                ));
            }
        } else {
            // Default: current month by weeks / days
            int year = today.getYear();
            int month = today.getMonthValue();
            for (int day = 1; day <= today.lengthOfMonth(); day++) {
                if (day > today.getDayOfMonth()) break;
                LocalDate d = LocalDate.of(year, month, day);
                BigDecimal daySum = activities.stream()
                        .filter(a -> d.equals(a.getLogDate()))
                        .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                trendPoints.add(Map.of(
                        "date", d.toString(),
                        "label", String.valueOf(day),
                        "emissions", daySum.setScale(2, RoundingMode.HALF_UP)
                ));
            }
        }

        // Category breakdown
        for (ActivityLog act : activities) {
            String catName = CATEGORY_MAP.getOrDefault(act.getCategoryId(), "Other");
            BigDecimal co2 = act.getCo2eKg() != null ? act.getCo2eKg() : BigDecimal.ZERO;
            categorySums.put(catName, categorySums.getOrDefault(catName, BigDecimal.ZERO).add(co2));
        }

        List<Map<String, Object>> categoryBreakdown = categorySums.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> Map.<String, Object>of(
                        "name", e.getKey(),
                        "emissions", e.getValue().setScale(2, RoundingMode.HALF_UP)
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "period", period,
                "trends", trendPoints,
                "categories", categoryBreakdown
        ));
    }

    // Anonymous peer benchmarking
    @GetMapping("/benchmarks")
    public ResponseEntity<?> getBenchmarks(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ActivityLog> userActivities = activityLogRepository.findByUserId(user.getId());
        List<ActivityLog> allActivities = activityLogRepository.findAll();

        BigDecimal userTotal = userActivities.stream()
                .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate average across users
        Set<Long> allUserIds = allActivities.stream().map(ActivityLog::getUserId).collect(Collectors.toSet());
        long userCount = Math.max(1, allUserIds.size());

        BigDecimal globalTotal = allActivities.stream()
                .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal communityAverage = globalTotal.divide(BigDecimal.valueOf(userCount), 2, RoundingMode.HALF_UP);

        // Compute percentile: what % of users emit MORE than this user (so lower emissions = higher percentile)
        Map<Long, BigDecimal> userTotals = new HashMap<>();
        for (ActivityLog act : allActivities) {
            userTotals.put(act.getUserId(),
                    userTotals.getOrDefault(act.getUserId(), BigDecimal.ZERO).add(
                            act.getCo2eKg() != null ? act.getCo2eKg() : BigDecimal.ZERO
                    ));
        }

        long usersWithHigherEmissions = userTotals.values().stream()
                .filter(tot -> tot.compareTo(userTotal) > 0)
                .count();

        int percentile = userTotals.isEmpty() ? 75 :
                (int) Math.round(((double) (usersWithHigherEmissions + 1) / userTotals.size()) * 100);
        percentile = Math.min(99, Math.max(5, percentile));

        // Category comparison
        List<Map<String, Object>> categoryComparison = new ArrayList<>();
        for (Map.Entry<Short, String> entry : CATEGORY_MAP.entrySet()) {
            Short catId = entry.getKey();
            String catName = entry.getValue();

            BigDecimal userCat = userActivities.stream()
                    .filter(a -> catId.equals(a.getCategoryId()))
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal allCat = allActivities.stream()
                    .filter(a -> catId.equals(a.getCategoryId()))
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal commCatAvg = allCat.divide(BigDecimal.valueOf(userCount), 2, RoundingMode.HALF_UP);

            categoryComparison.add(Map.of(
                    "category", catName,
                    "userEmissions", userCat.setScale(2, RoundingMode.HALF_UP),
                    "communityAverage", commCatAvg
            ));
        }

        return ResponseEntity.ok(Map.of(
                "userTotalCo2e", userTotal.setScale(2, RoundingMode.HALF_UP),
                "communityAverageCo2e", communityAverage,
                "percentile", percentile,
                "communityUserCount", userCount,
                "categoryComparison", categoryComparison
        ));
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
