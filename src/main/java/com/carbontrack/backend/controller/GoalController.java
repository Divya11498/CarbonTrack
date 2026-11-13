package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.event.GoalUpdatedEvent;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.CacheEvictionService;
import com.carbontrack.backend.service.EmailService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalRepository goalRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final EmailService emailService;
    private final CacheEvictionService cacheEvictionService;

    public GoalController(
            GoalRepository goalRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher,
            EmailService emailService,
            CacheEvictionService cacheEvictionService) {
        this.goalRepository = goalRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.emailService = emailService;
        this.cacheEvictionService = cacheEvictionService;
    }

    @GetMapping
    public ResponseEntity<?> getGoals(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Goal> goals = goalRepository.findByUserId(user.getId());
        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());

        List<Map<String, Object>> result = goals.stream()
                .map(g -> enrichGoalResponse(user, g, activities))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createGoal(
            @RequestBody Goal goal,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (goal.getTitle() == null || goal.getTitle().isBlank() || goal.getTargetValue() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Goal title and target value are required"));
        }

        goal.setUserId(user.getId());
        LocalDate start = goal.getStartDate() != null ? goal.getStartDate() : LocalDate.now().withDayOfMonth(1);
        goal.setStartDate(start);

        String periodType = goal.getPeriodType() != null ? goal.getPeriodType().toUpperCase() : "MONTHLY";
        goal.setPeriodType(periodType);

        if (goal.getEndDate() == null) {
            goal.setEndDate(defaultEndDate(start, periodType));
        }
        if (goal.getStatus() == null || goal.getStatus().isBlank()) {
            goal.setStatus("ACTIVE");
        }
        if (goal.getTargetUnit() == null || goal.getTargetUnit().isBlank()) {
            goal.setTargetUnit("kgCO2e");
        }
        if (goal.getGoalType() == null || goal.getGoalType().isBlank()) {
            goal.setGoalType(goal.getCategoryId() != null ? "REDUCE_CATEGORY" : "REDUCE_CO2E");
        }

        if (goal.getBaselineCo2eKg() == null && goal.getReductionPercentage() != null
                && goal.getReductionPercentage().doubleValue() > 0
                && goal.getReductionPercentage().doubleValue() < 100) {
            double divisor = 1.0 - (goal.getReductionPercentage().doubleValue() / 100.0);
            BigDecimal computedBaseline = BigDecimal.valueOf(goal.getTargetValue().doubleValue() / divisor)
                    .setScale(2, RoundingMode.HALF_UP);
            goal.setBaselineCo2eKg(computedBaseline);
        }

        Goal saved = goalRepository.save(goal);
        cacheEvictionService.evictGoalDerivedCaches();
        eventPublisher.publishEvent(new GoalUpdatedEvent(user.getId(), saved.getId(), saved.getStatus()));

        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(enrichGoalResponse(user, saved, activities));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<?> getGoalProgress(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Goal goal = goalRepository.findById(id).orElse(null);
        if (goal == null || !goal.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Goal not found"));
        }

        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());
        return ResponseEntity.ok(calculateGoalProgress(user, goal, activities, false));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGoal(
            @PathVariable Long id,
            @RequestBody Goal updated,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Goal existing = goalRepository.findById(id).orElse(null);
        if (existing == null || !existing.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Goal not found"));
        }

        if (updated.getTitle() != null && !updated.getTitle().isBlank()) {
            existing.setTitle(updated.getTitle().trim());
        }
        if (updated.getTargetValue() != null) {
            existing.setTargetValue(updated.getTargetValue());
        }
        if (updated.getStatus() != null && !updated.getStatus().isBlank()) {
            existing.setStatus(updated.getStatus().toUpperCase());
        }
        if (updated.getPeriodType() != null && !updated.getPeriodType().isBlank()) {
            existing.setPeriodType(updated.getPeriodType().toUpperCase());
        }
        if (updated.getStartDate() != null) {
            existing.setStartDate(updated.getStartDate());
        }
        if (updated.getEndDate() != null) {
            existing.setEndDate(updated.getEndDate());
        }
        if (updated.getCategoryId() != null) {
            existing.setCategoryId(updated.getCategoryId());
        }
        if (updated.getGoalType() != null && !updated.getGoalType().isBlank()) {
            existing.setGoalType(updated.getGoalType());
        }
        if (updated.getReductionPercentage() != null) {
            existing.setReductionPercentage(updated.getReductionPercentage());
        }
        if (updated.getBaselineCo2eKg() != null) {
            existing.setBaselineCo2eKg(updated.getBaselineCo2eKg());
        }

        Goal saved = goalRepository.save(existing);
        cacheEvictionService.evictGoalDerivedCaches();
        eventPublisher.publishEvent(new GoalUpdatedEvent(user.getId(), saved.getId(), saved.getStatus()));

        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());
        Map<String, Object> response = enrichGoalResponse(user, saved, activities);
        if ("COMPLETED".equalsIgnoreCase(saved.getStatus()) || "ACHIEVED".equalsIgnoreCase(saved.getStatus())) {
            emailService.sendGoalAchievedEmail(user, saved, (BigDecimal) response.get("actualValue"));
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGoal(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Goal existing = goalRepository.findById(id).orElse(null);
        if (existing == null || !existing.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Goal not found"));
        }

        goalRepository.delete(existing);
        cacheEvictionService.evictGoalDerivedCaches();
        return ResponseEntity.ok(Map.of("message", "Goal deleted successfully", "id", id));
    }

    private Map<String, Object> enrichGoalResponse(User user, Goal g, List<ActivityLog> activities) {
        Map<String, Object> progress = calculateGoalProgress(user, g, activities, true);

        Map<String, Object> map = new HashMap<>();
        map.put("id", g.getId());
        map.put("title", g.getTitle());
        map.put("goalType", g.getGoalType());
        map.put("targetValue", g.getTargetValue());
        map.put("targetUnit", g.getTargetUnit());
        map.put("periodType", g.getPeriodType());
        map.put("startDate", g.getStartDate());
        map.put("endDate", progress.get("periodEndDate"));
        map.put("status", progress.get("effectiveStatus"));
        map.put("categoryId", g.getCategoryId());
        map.put("reductionPercentage", g.getReductionPercentage());
        map.put("baselineCo2eKg", g.getBaselineCo2eKg());
        map.put("actualValue", progress.get("actualValue"));
        map.put("percentAchieved", progress.get("percentAchieved"));
        map.put("remainingAllowance", progress.get("remainingAllowance"));
        map.put("dailyBudgetKg", progress.get("dailyBudgetKg"));
        map.put("dailyReductionNeededKg", progress.get("dailyReductionNeededKg"));
        map.put("projectedCo2eKg", progress.get("projectedCo2eKg"));
        map.put("daysRemaining", progress.get("daysRemaining"));
        map.put("totalDays", progress.get("totalDays"));
        map.put("onTrack", progress.get("onTrack"));
        return map;
    }

    private Map<String, Object> calculateGoalProgress(
            User user,
            Goal goal,
            List<ActivityLog> activities,
            boolean triggerAlerts) {

        LocalDate today = LocalDate.now();
        LocalDate start = goal.getStartDate() != null ? goal.getStartDate() : today.withDayOfMonth(1);
        LocalDate end = goal.getEndDate() != null ? goal.getEndDate() : defaultEndDate(start, goal.getPeriodType());

        BigDecimal actual = activities.stream()
                .filter(a -> a.getLogDate() != null && !a.getLogDate().isBefore(start) && !a.getLogDate().isAfter(end))
                .filter(a -> goal.getCategoryId() == null || goal.getCategoryId().equals(a.getCategoryId()))
                .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal target = goal.getTargetValue() != null && goal.getTargetValue().compareTo(BigDecimal.ZERO) > 0
                ? goal.getTargetValue()
                : new BigDecimal("100.00");

        long totalDays = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
        long daysElapsed = today.isBefore(start)
                ? 0
                : Math.min(totalDays, ChronoUnit.DAYS.between(start, today) + 1);
        long daysRemaining = today.isAfter(end) ? 0 : ChronoUnit.DAYS.between(today, end) + 1;

        double actualD = actual.doubleValue();
        double targetD = target.doubleValue();
        double dailyAvg = daysElapsed > 0 ? actualD / daysElapsed : 0.0;
        double projectedCo2e = dailyAvg * totalDays;

        BigDecimal remaining = target.subtract(actual);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        double dailyBudgetKg = daysRemaining > 0 ? remaining.doubleValue() / daysRemaining : 0.0;
        double historicalDailyBaseline = goal.getBaselineCo2eKg() != null && goal.getBaselineCo2eKg().doubleValue() > 0
                ? goal.getBaselineCo2eKg().doubleValue() / totalDays
                : dailyAvg;
        double dailyReductionNeeded = Math.max(0.0, historicalDailyBaseline - dailyBudgetKg);

        boolean onTrack = actualD <= targetD && (daysElapsed == 0 || projectedCo2e <= targetD * 1.05);

        String effectiveStatus = goal.getStatus();
        if ("ACTIVE".equalsIgnoreCase(effectiveStatus) && today.isAfter(end)) {
            effectiveStatus = actualD <= targetD ? "ACHIEVED" : "MISSED";
            goal.setStatus(effectiveStatus);
            goalRepository.save(goal);
            if ("ACHIEVED".equals(effectiveStatus)) {
                emailService.sendGoalAchievedEmail(user, goal, actual);
                eventPublisher.publishEvent(new GoalUpdatedEvent(user.getId(), goal.getId(), effectiveStatus));
            }
        } else if (triggerAlerts && "ACTIVE".equalsIgnoreCase(effectiveStatus) && daysElapsed >= 3 && projectedCo2e > targetD * 1.15) {
            emailService.sendGoalCorrectionAlert(user, goal, actual, projectedCo2e);
        }

        double percent = targetD > 0 ? (actualD / targetD) * 100.0 : 0.0;

        Map<String, Object> map = new HashMap<>();
        map.put("goalId", goal.getId());
        map.put("actualValue", actual.setScale(2, RoundingMode.HALF_UP));
        map.put("targetValue", target.setScale(2, RoundingMode.HALF_UP));
        map.put("percentAchieved", Math.min(100.0, Math.round(percent * 10.0) / 10.0));
        map.put("remainingAllowance", remaining.setScale(2, RoundingMode.HALF_UP));
        map.put("periodStart", start.toString());
        map.put("periodEnd", end.toString());
        map.put("periodEndDate", end);
        map.put("totalDays", totalDays);
        map.put("daysElapsed", daysElapsed);
        map.put("daysRemaining", daysRemaining);
        map.put("dailyBudgetKg", BigDecimal.valueOf(dailyBudgetKg).setScale(2, RoundingMode.HALF_UP));
        map.put("dailyReductionNeededKg", BigDecimal.valueOf(dailyReductionNeeded).setScale(2, RoundingMode.HALF_UP));
        map.put("projectedCo2eKg", BigDecimal.valueOf(projectedCo2e).setScale(2, RoundingMode.HALF_UP));
        map.put("onTrack", onTrack);
        map.put("effectiveStatus", effectiveStatus);
        return map;
    }

    private LocalDate defaultEndDate(LocalDate start, String periodType) {
        if ("WEEKLY".equalsIgnoreCase(periodType)) return start.plusDays(6);
        if ("QUARTERLY".equalsIgnoreCase(periodType)) return start.plusMonths(3).minusDays(1);
        if ("YEARLY".equalsIgnoreCase(periodType)) return start.plusYears(1).minusDays(1);
        return start.plusMonths(1).minusDays(1);
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
