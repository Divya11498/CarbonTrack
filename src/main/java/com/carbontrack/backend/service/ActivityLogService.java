
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final EmissionCalculationService emissionCalculationService;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            EmissionCalculationService emissionCalculationService) {
        this.activityLogRepository = activityLogRepository;
        this.emissionCalculationService = emissionCalculationService;
    }

    @Transactional
    public ActivityLog createActivity(ActivityLog activityLog) {
        if (activityLog == null) {
            throw new IllegalArgumentException(
                    "Activity log cannot be null.");
        }

        EmissionCalculationResult result =
                emissionCalculationService.calculateEmission(
                        activityLog.getActivityTypeId(),
                        activityLog.getQuantity(),
                        activityLog.getUnit(),
                        activityLog.getLogDate());

        activityLog.setCo2eKg(result.co2eKg());
        activityLog.setEmissionFactorId(result.emissionFactorId());

        return activityLogRepository.save(activityLog);
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByUserId(Long userId) {
        validateUserId(userId);
        return activityLogRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getEmissionsByDateRange(
            Long userId, LocalDate startDate, LocalDate endDate) {

        validateUserId(userId);

        if (startDate == null || endDate == null
                || !startDate.isBefore(endDate)) {
            throw new IllegalArgumentException(
                    "Start date must be before end date.");
        }

        return activityLogRepository.sumEmissionsByUserAndDateRange(
                userId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public BigDecimal getDailyEmissions(Long userId, LocalDate date) {
        validateDate(date);
        return getEmissionsByDateRange(
                userId, date, date.plusDays(1));
    }

    @Transactional(readOnly = true)
    public BigDecimal getWeeklyEmissions(Long userId, LocalDate date) {
        validateDate(date);

        LocalDate weekStart = date.with(
                TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        return getEmissionsByDateRange(
                userId, weekStart, weekStart.plusWeeks(1));
    }

    @Transactional(readOnly = true)
    public BigDecimal getMonthlyEmissions(Long userId, LocalDate date) {
        validateDate(date);

        LocalDate monthStart = date.withDayOfMonth(1);

        return getEmissionsByDateRange(
                userId, monthStart, monthStart.plusMonths(1));
    }

    private void validateUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "User ID must be a positive number.");
        }
    }

    private void validateDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException(
                    "Date cannot be null.");
        }
    }
}
