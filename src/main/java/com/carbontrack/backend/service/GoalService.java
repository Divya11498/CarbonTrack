
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.GoalProgress;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.GoalProgressRepository;
import com.carbontrack.backend.repository.GoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final GoalProgressRepository goalProgressRepository;
    private final ActivityLogRepository activityLogRepository;

    public GoalService(
            GoalRepository goalRepository,
            GoalProgressRepository goalProgressRepository,
            ActivityLogRepository activityLogRepository) {
        this.goalRepository = goalRepository;
        this.goalProgressRepository = goalProgressRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional
    public Goal createGoal(Long userId, Goal goal) {
        if (goal.getTitle() == null || goal.getTitle().isBlank()) {
            throw new IllegalArgumentException("Goal title is required");
        }

        if (goal.getTargetValue() == null
                || goal.getTargetValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Goal target must be greater than zero");
        }

        if (goal.getGoalType() == null || goal.getGoalType().isBlank()) {
            throw new IllegalArgumentException("Goal type is required");
        }

        if (goal.getTargetUnit() == null || goal.getTargetUnit().isBlank()) {
            throw new IllegalArgumentException(
                    "Goal target unit is required");
        }

        if (goal.getPeriodType() == null || goal.getPeriodType().isBlank()) {
            throw new IllegalArgumentException(
                    "Goal period type is required");
        }

        goal.setUserId(userId);
        goal.setStatus("ACTIVE");

        if (goal.getStartDate() == null) {
            goal.setStartDate(LocalDate.now());
        }

        return goalRepository.save(goal);
    }

    @Transactional(readOnly = true)
    public List<Goal> getUserGoals(Long userId) {
        return goalRepository.findByUserId(userId);
    }

    @Transactional
    public Map<String, Object> getGoalProgress(
            Long userId, Long goalId) {

        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Goal not found for this user"));

        if (!"REDUCE_CO2E".equalsIgnoreCase(goal.getGoalType())) {
            throw new IllegalArgumentException(
                    "Progress calculation currently supports "
                            + "REDUCE_CO2E goals only");
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = goal.getStartDate();

        LocalDate endDate = goal.getEndDate() != null
                ? goal.getEndDate()
                : calculateEndDate(goal);

        // The repository query uses an exclusive end date.
        LocalDate effectiveEndDate = today.isBefore(endDate)
                ? today.plusDays(1)
                : endDate.plusDays(1);

        BigDecimal actualEmissions =
                activityLogRepository.sumEmissionsByUserAndDateRange(
                        userId, startDate, effectiveEndDate);

        if (actualEmissions == null) {
            actualEmissions = BigDecimal.ZERO;
        }

        BigDecimal target = goal.getTargetValue();

        BigDecimal percentAchieved = actualEmissions
                .multiply(BigDecimal.valueOf(100))
                .divide(target, 2, RoundingMode.HALF_UP);

        boolean onTrack = actualEmissions.compareTo(target) <= 0;

        // Save progress for the week containing the current date.
        LocalDate periodStart = today.with(
                TemporalAdjusters.previousOrSame(
                        java.time.DayOfWeek.MONDAY));

        LocalDate periodEnd = periodStart.plusDays(6);

        GoalProgress progress = goalProgressRepository
                .findByGoalIdAndPeriodStartAndPeriodEnd(
                        goalId, periodStart, periodEnd)
                .orElseGet(GoalProgress::new);

        progress.setGoalId(goalId);
        progress.setPeriodStart(periodStart);
        progress.setPeriodEnd(periodEnd);
        progress.setActualValue(actualEmissions);
        progress.setTargetValue(target);
        progress.setPercentAchieved(percentAchieved);

        goalProgressRepository.save(progress);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("goalId", goalId);
        response.put("title", goal.getTitle());
        response.put("goalType", goal.getGoalType());
        response.put("targetValue", target);
        response.put("targetUnit", goal.getTargetUnit());
        response.put("actualEmissionsKgCo2e", actualEmissions);
        response.put("percentAchieved", percentAchieved);
        response.put("onTrack", onTrack);
        response.put(
                "message",
                onTrack
                        ? "You're within your CO2e target. Keep it up!"
                        : "Your emissions have exceeded the target. "
                        + "Consider reducing high-emission activities."
        );

        return response;
    }

    private LocalDate calculateEndDate(Goal goal) {
        String periodType = goal.getPeriodType().toUpperCase();

        return switch (periodType) {
            case "WEEKLY" ->
                    goal.getStartDate().plusWeeks(1).minusDays(1);
            case "MONTHLY" ->
                    goal.getStartDate().plusMonths(1).minusDays(1);
            case "YEARLY" ->
                    goal.getStartDate().plusYears(1).minusDays(1);
            default ->
                    goal.getStartDate().plusDays(29);
        };
    }
}
