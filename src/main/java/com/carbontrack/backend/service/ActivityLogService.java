package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.repository.ActivityLogRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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

    // Create an activity and invalidate cached analytics
    @CacheEvict(cacheNames = "analytics", allEntries = true)
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

    // Retrieve all activities
    @Transactional(readOnly = true)
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findAll();
    }

    // Retrieve activities belonging to a specific user
    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByUserId(Long userId) {

        validateUserId(userId);

        return activityLogRepository.findByUserId(userId);
    }

    // Calculate emissions for a date range
    @Transactional(readOnly = true)
    public BigDecimal getEmissionsByDateRange(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        validateUserId(userId);

        if (startDate == null || endDate == null
                || !startDate.isBefore(endDate)) {

            throw new IllegalArgumentException(
                    "Start date must be before end date.");
        }

        return activityLogRepository.sumEmissionsByUserAndDateRange(
                userId, startDate, endDate);
    }

    // Daily analytics with Redis caching
    @Cacheable(
            cacheNames = "analytics",
            key = "#userId + ':daily:' + #date"
    )
    @Transactional(readOnly = true)
    public BigDecimal getDailyEmissions(
            Long userId,
            LocalDate date) {

        validateUserId(userId);
        validateDate(date);

        return getEmissionsByDateRange(
                userId,
                date,
                date.plusDays(1));
    }

    // Weekly analytics with Redis caching
    @Cacheable(
            cacheNames = "analytics",
            key = "#userId + ':weekly:' + #date"
    )
    @Transactional(readOnly = true)
    public BigDecimal getWeeklyEmissions(
            Long userId,
            LocalDate date) {

        validateUserId(userId);
        validateDate(date);

        LocalDate weekStart = date.with(
                TemporalAdjusters.previousOrSame(
                        DayOfWeek.MONDAY));

        return getEmissionsByDateRange(
                userId,
                weekStart,
                weekStart.plusWeeks(1));
    }

    // Monthly analytics with Redis caching
    @Cacheable(
            cacheNames = "analytics",
            key = "#userId + ':monthly:' + #date"
    )
    @Transactional(readOnly = true)
    public BigDecimal getMonthlyEmissions(
            Long userId,
            LocalDate date) {

        validateUserId(userId);
        validateDate(date);

        LocalDate monthStart = date.withDayOfMonth(1);

        return getEmissionsByDateRange(
                userId,
                monthStart,
                monthStart.plusMonths(1));
    }

    // Validate user ID
    private void validateUserId(Long userId) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "User ID must be a positive number.");
        }
    }

    // Validate date
    private void validateDate(LocalDate date) {

        if (date == null) {
            throw new IllegalArgumentException(
                    "Date cannot be null.");
        }
    }
}