package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalRepository goalRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public GoalController(
            GoalRepository goalRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getGoals(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Goal> goals = goalRepository.findByUserId(user.getId());
        List<ActivityLog> activities = activityLogRepository.findByUserId(user.getId());

        List<Map<String, Object>> result = goals.stream().map(g -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", g.getId());
            map.put("title", g.getTitle());
            map.put("goalType", g.getGoalType());
            map.put("targetValue", g.getTargetValue());
            map.put("targetUnit", g.getTargetUnit());
            map.put("periodType", g.getPeriodType());
            map.put("startDate", g.getStartDate());
            map.put("endDate", g.getEndDate());
            map.put("status", g.getStatus());
            map.put("categoryId", g.getCategoryId());

            Map<String, Object> progress = calculateGoalProgress(g, activities);
            map.put("actualValue", progress.get("actualValue"));
            map.put("percentAchieved", progress.get("percentAchieved"));
            map.put("remainingAllowance", progress.get("remainingAllowance"));

            return map;
        }).collect(Collectors.toList());

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
        if (goal.getStartDate() == null) {
            goal.setStartDate(LocalDate.now());
        }
        if (goal.getStatus() == null) {
            goal.setStatus("ACTIVE");
        }
        if (goal.getPeriodType() == null) {
            goal.setPeriodType("MONTHLY");
        }
        if (goal.getTargetUnit() == null) {
            goal.setTargetUnit("kgCO2e");
        }

        Goal saved = goalRepository.save(goal);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
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
        Map<String, Object> progress = calculateGoalProgress(goal, activities);

        return ResponseEntity.ok(progress);
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
            existing.setTitle(updated.getTitle());
        }
        if (updated.getTargetValue() != null) {
            existing.setTargetValue(updated.getTargetValue());
        }
        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }
        if (updated.getPeriodType() != null) {
            existing.setPeriodType(updated.getPeriodType());
        }

        Goal saved = goalRepository.save(existing);
        return ResponseEntity.ok(saved);
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
        return ResponseEntity.ok(Map.of("message", "Goal deleted successfully", "id", id));
    }

    private Map<String, Object> calculateGoalProgress(Goal goal, List<ActivityLog> activities) {
        LocalDate now = LocalDate.now();
        LocalDate start = goal.getStartDate() != null ? goal.getStartDate() : now.withDayOfMonth(1);

        BigDecimal actual = activities.stream()
                .filter(a -> a.getLogDate() != null && !a.getLogDate().isBefore(start))
                .filter(a -> goal.getCategoryId() == null || goal.getCategoryId().equals(a.getCategoryId()))
                .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal target = goal.getTargetValue() != null && goal.getTargetValue().compareTo(BigDecimal.ZERO) > 0
                ? goal.getTargetValue()
                : new BigDecimal("100.00");

        double percent = (actual.doubleValue() / target.doubleValue()) * 100.0;
        BigDecimal remaining = target.subtract(actual);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        Map<String, Object> map = new HashMap<>();
        map.put("goalId", goal.getId());
        map.put("actualValue", actual.setScale(2, RoundingMode.HALF_UP));
        map.put("targetValue", target.setScale(2, RoundingMode.HALF_UP));
        map.put("percentAchieved", Math.min(100.0, Math.round(percent * 10.0) / 10.0));
        map.put("remainingAllowance", remaining.setScale(2, RoundingMode.HALF_UP));
        map.put("periodStart", start.toString());
        map.put("periodEnd", now.toString());
        return map;
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
