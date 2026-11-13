package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.*;
import com.carbontrack.backend.event.ActivityLoggedEvent;
import com.carbontrack.backend.event.GoalUpdatedEvent;
import com.carbontrack.backend.repository.*;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AchievementEvaluationService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AchievementEvaluationService(
            BadgeRepository badgeRepository,
            UserBadgeRepository userBadgeRepository,
            ActivityLogRepository activityLogRepository,
            GoalRepository goalRepository,
            UserProfileRepository userProfileRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @EventListener
    public void onActivityLogged(ActivityLoggedEvent event) {
        if (event != null && event.userId() != null) {
            evaluateAndAwardForUser(event.userId(), "ACTIVITY_" + event.actionType());
        }
    }

    @EventListener
    public void onGoalUpdated(GoalUpdatedEvent event) {
        if (event != null && event.userId() != null) {
            evaluateAndAwardForUser(event.userId(), "GOAL_" + event.status());
        }
    }

    public List<Badge> evaluateAndAwardForUser(Long userId, String sourceEvent) {
        List<Badge> allBadges = badgeRepository.findAll();
        List<UserBadge> existing = userBadgeRepository.findByUserId(userId);
        Set<Short> earnedIds = existing.stream().map(UserBadge::getBadgeId).collect(Collectors.toSet());

        List<ActivityLog> logs = activityLogRepository.findByUserId(userId);
        List<Goal> goals = goalRepository.findByUserId(userId);
        MetricsSnapshot metrics = computeMetrics(userId, logs, goals);

        User user = userRepository.findById(userId).orElse(null);
        List<Badge> newlyUnlocked = new ArrayList<>();

        for (Badge badge : allBadges) {
            if (earnedIds.contains(badge.getId())) {
                continue;
            }
            BadgeProgress prog = evaluateBadgeProgress(badge.getCode(), metrics);
            if (prog.qualified()) {
                if (userBadgeRepository.findByUserIdAndBadgeId(userId, badge.getId()).isEmpty()) {
                    try {
                        UserBadge ub = new UserBadge(userId, badge.getId(), sourceEvent);
                        userBadgeRepository.save(ub);
                        newlyUnlocked.add(badge);
                        if (user != null) {
                            emailService.sendAchievementUnlocked(user, badge);
                        }
                    } catch (Exception ignored) {
                        // Guard against concurrent duplicate insert on UNIQUE(user_id, badge_id)
                    }
                }
            }
        }
        return newlyUnlocked;
    }

    public List<Map<String, Object>> getUserBadgesWithProgress(Long userId) {
        // Run idempotent evaluation to keep earned badges synchronized
        evaluateAndAwardForUser(userId, "PROFILE_SYNC");

        List<Badge> allBadges = badgeRepository.findAll();
        List<UserBadge> earnedList = userBadgeRepository.findByUserId(userId);
        Map<Short, UserBadge> earnedMap = earnedList.stream()
                .collect(Collectors.toMap(UserBadge::getBadgeId, ub -> ub, (a, b) -> a));

        List<ActivityLog> logs = activityLogRepository.findByUserId(userId);
        List<Goal> goals = goalRepository.findByUserId(userId);
        MetricsSnapshot metrics = computeMetrics(userId, logs, goals);

        List<Map<String, Object>> results = new ArrayList<>();
        for (Badge b : allBadges) {
            UserBadge ub = earnedMap.get(b.getId());
            boolean unlocked = ub != null;
            BadgeProgress progress = evaluateBadgeProgress(b.getCode(), metrics);

            Map<String, Object> row = new HashMap<>();
            row.put("id", b.getId());
            row.put("code", b.getCode());
            row.put("name", b.getName());
            row.put("description", b.getDescription());
            row.put("badgeType", b.getBadgeType());
            row.put("iconUrl", b.getIconUrl());
            row.put("unlocked", unlocked);
            row.put("earnedAt", unlocked ? ub.getEarnedAt() : null);
            row.put("sourceEvent", unlocked ? ub.getSourceEvent() : null);
            row.put("progressPercent", unlocked ? 100 : progress.percent());
            row.put("currentValue", progress.currentValue());
            row.put("targetValue", progress.targetValue());
            row.put("progressLabel", unlocked ? "Unlocked" : progress.label());
            results.add(row);
        }
        return results;
    }

    private MetricsSnapshot computeMetrics(Long userId, List<ActivityLog> logs, List<Goal> goals) {
        int totalActivities = logs.size();
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate prevMonthStart = startOfMonth.minusMonths(1);

        int maxStreak = computeMaxStreak(logs);
        long monthDistinctDays = logs.stream()
                .map(ActivityLog::getLogDate)
                .filter(d -> d != null && !d.isBefore(startOfMonth))
                .distinct()
                .count();

        double activeTransportKmMonth = logs.stream()
                .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(startOfMonth))
                .filter(l -> l.getActivityTypeId() != null && (l.getActivityTypeId() == 6 || l.getActivityTypeId() == 7))
                .mapToDouble(l -> l.getQuantity() != null ? l.getQuantity().doubleValue() : 0.0)
                .sum();

        long plantMealsMonth = logs.stream()
                .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(startOfMonth))
                .filter(l -> l.getActivityTypeId() != null && (l.getActivityTypeId() == 16 || l.getActivityTypeId() == 17))
                .count();

        double thisMonthCo2 = logs.stream()
                .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(startOfMonth))
                .mapToDouble(l -> l.getCo2eKg() != null ? l.getCo2eKg().doubleValue() : 0.0)
                .sum();

        double prevMonthCo2 = logs.stream()
                .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(prevMonthStart) && l.getLogDate().isBefore(startOfMonth))
                .mapToDouble(l -> l.getCo2eKg() != null ? l.getCo2eKg().doubleValue() : 0.0)
                .sum();

        double monthlyTarget = userProfileRepository.findByUserId(userId)
                .map(UserProfile::getMonthlyTargetKgco2e)
                .map(BigDecimal::doubleValue)
                .orElse(200.0);

        double referenceBaseline = prevMonthCo2 > 0 ? prevMonthCo2 : monthlyTarget;
        double kgReduced = logs.isEmpty() ? 0.0 : Math.max(0.0, referenceBaseline - thisMonthCo2);
        double reductionPct = referenceBaseline > 0 && !logs.isEmpty()
                ? Math.max(0.0, ((referenceBaseline - thisMonthCo2) / referenceBaseline) * 100.0)
                : 0.0;

        long achievedGoals = goals.stream()
                .filter(g -> "ACHIEVED".equalsIgnoreCase(g.getStatus()) || "COMPLETED".equalsIgnoreCase(g.getStatus()))
                .count();

        // Count consecutive months with low footprint (<= monthlyTarget) across past 3 months including logs
        int lowMonths = 0;
        for (int i = 0; i < 3; i++) {
            LocalDate mStart = startOfMonth.minusMonths(i);
            LocalDate mEnd = mStart.plusMonths(1);
            List<ActivityLog> mLogs = logs.stream()
                    .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(mStart) && l.getLogDate().isBefore(mEnd))
                    .toList();
            double sum = mLogs.stream().mapToDouble(l -> l.getCo2eKg() != null ? l.getCo2eKg().doubleValue() : 0.0).sum();
            if (!mLogs.isEmpty() && sum <= monthlyTarget) {
                lowMonths++;
            }
        }

        boolean inTop10Percent = computeTop10Percentile(userId, startOfMonth);

        return new MetricsSnapshot(
                totalActivities,
                maxStreak,
                (int) monthDistinctDays,
                activeTransportKmMonth,
                (int) plantMealsMonth,
                kgReduced,
                reductionPct,
                (int) achievedGoals,
                lowMonths,
                inTop10Percent
        );
    }

    private boolean computeTop10Percentile(Long userId, LocalDate since) {
        List<ActivityLog> all = activityLogRepository.findAll();
        Map<Long, Double> totals = new HashMap<>();
        for (ActivityLog a : all) {
            if (a.getUserId() != null && a.getLogDate() != null && !a.getLogDate().isBefore(since)) {
                totals.merge(a.getUserId(), a.getCo2eKg() != null ? a.getCo2eKg().doubleValue() : 0.0, Double::sum);
            }
        }
        if (totals.size() < 2 || !totals.containsKey(userId)) {
            return false;
        }
        double myVal = totals.get(userId);
        long betterOrEqualCount = totals.values().stream().filter(v -> v <= myVal).count();
        double percentile = (double) betterOrEqualCount / totals.size();
        return percentile <= 0.15;
    }

    private int computeMaxStreak(List<ActivityLog> logs) {
        List<LocalDate> sortedDates = logs.stream()
                .map(ActivityLog::getLogDate)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        if (sortedDates.isEmpty()) return 0;

        int max = 1;
        int cur = 1;
        for (int i = 1; i < sortedDates.size(); i++) {
            if (sortedDates.get(i).equals(sortedDates.get(i - 1).plusDays(1))) {
                cur++;
                if (cur > max) max = cur;
            } else {
                cur = 1;
            }
        }
        return max;
    }

    private BadgeProgress evaluateBadgeProgress(String code, MetricsSnapshot m) {
        return switch (code) {
            case "eco_pioneer" -> progressInt(m.totalActivities(), 1, "activities");
            case "week_warrior" -> progressInt(m.maxStreak(), 7, "day streak");
            case "first_goal_achieved" -> progressInt(m.achievedGoals(), 1, "goal achieved");
            case "reduction_10kg" -> progressDouble(m.kgReduced(), 10.0, "kg saved");
            case "reduction_25kg" -> progressDouble(m.kgReduced(), 25.0, "kg saved");
            case "reduction_50kg" -> progressDouble(m.kgReduced(), 50.0, "kg saved");
            case "carbon_cutter" -> progressDouble(m.reductionPct(), 20.0, "% reduction");
            case "month_master" -> progressInt(m.monthDistinctDays(), 30, "days this month");
            case "bike_buddy" -> progressDouble(m.activeTransportKmMonth(), 100.0, "km active travel");
            case "vegetarian_victor" -> progressInt(m.plantMealsMonth(), 20, "plant-based meals");
            case "green_leader" -> new BadgeProgress(
                    m.inTop10Percent(),
                    m.inTop10Percent() ? 100 : 25,
                    m.inTop10Percent() ? 1.0 : 0.0,
                    1.0,
                    m.inTop10Percent() ? "Top 10% achieved" : "Reach top 10% rank"
            );
            case "sustainability_champion" -> progressInt(m.lowFootprintMonths(), 3, "low-carbon months");
            default -> new BadgeProgress(false, 0, 0.0, 1.0, "In progress");
        };
    }

    private BadgeProgress progressInt(int cur, int target, String unit) {
        int clamped = Math.min(cur, target);
        int pct = target > 0 ? Math.min(100, (int) Math.round((clamped * 100.0) / target)) : 0;
        return new BadgeProgress(cur >= target, pct, (double) clamped, (double) target, clamped + " / " + target + " " + unit);
    }

    private BadgeProgress progressDouble(double cur, double target, String unit) {
        double clamped = Math.min(cur, target);
        int pct = target > 0 ? Math.min(100, (int) Math.round((clamped * 100.0) / target)) : 0;
        double roundedCur = BigDecimal.valueOf(clamped).setScale(1, RoundingMode.HALF_UP).doubleValue();
        return new BadgeProgress(cur >= target, pct, roundedCur, target, roundedCur + " / " + target + " " + unit);
    }

    private record MetricsSnapshot(
            int totalActivities,
            int maxStreak,
            int monthDistinctDays,
            double activeTransportKmMonth,
            int plantMealsMonth,
            double kgReduced,
            double reductionPct,
            int achievedGoals,
            int lowFootprintMonths,
            boolean inTop10Percent
    ) {}

    private record BadgeProgress(
            boolean qualified,
            int percent,
            double currentValue,
            double targetValue,
            String label
    ) {}
}
