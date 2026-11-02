package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.event.ActivityLoggedEvent;
import com.carbontrack.backend.repository.ActivityLogRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final EmissionCalculationService emissionCalculationService;
    private final ApplicationEventPublisher eventPublisher;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            EmissionCalculationService emissionCalculationService,
            ApplicationEventPublisher eventPublisher) {

        this.activityLogRepository = activityLogRepository;
        this.emissionCalculationService = emissionCalculationService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    @CacheEvict(cacheNames = "analytics", allEntries = true)
    public ActivityLog createActivity(ActivityLog activityLog) {

        if (activityLog == null) {
            throw new IllegalArgumentException(
                    "Activity details are required");
        }

        if (activityLog.getUserId() == null) {
            throw new IllegalArgumentException(
                    "User ID is required");
        }

        if (activityLog.getCategoryId() == null) {
            throw new IllegalArgumentException(
                    "Category ID is required");
        }

        EmissionCalculationResult calculation =
                emissionCalculationService.calculateEmission(
                        activityLog.getActivityTypeId(),
                        activityLog.getQuantity(),
                        activityLog.getUnit(),
                        activityLog.getLogDate()
                );

        if (calculation == null
                || calculation.co2eKg() == null
                || calculation.emissionFactorId() == null) {

            throw new IllegalStateException(
                    "Emission calculation did not return a valid result");
        }

        activityLog.setCo2eKg(calculation.co2eKg());
        activityLog.setEmissionFactorId(
                calculation.emissionFactorId());

        if (activityLog.getSource() == null
                || activityLog.getSource().isBlank()) {
            activityLog.setSource("MANUAL");
        }

        ActivityLog savedActivity =
                activityLogRepository.save(activityLog);

        eventPublisher.publishEvent(
                new ActivityLoggedEvent(
                        savedActivity.getUserId(),
                        savedActivity.getLogDate()
                )
        );

        return savedActivity;
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByUserId(Long userId) {
        return activityLogRepository.findByUserId(userId);
    }

    @Cacheable(
            cacheNames = "analytics",
            key = "#userId + ':daily:' + #date"
    )
    @Transactional(readOnly = true)
    public Map<String, Object> getDailyEmissions(
            Long userId, LocalDate date) {

        BigDecimal total =
                activityLogRepository.sumEmissionsByUserAndDateRange(
                        userId, date, date.plusDays(1));

        return createResponse(userId, total, "daily", date);
    }

    @Cacheable(
            cacheNames = "analytics",
            key = "#userId + ':weekly:' + #date"
    )
    @Transactional(readOnly = true)
    public Map<String, Object> getWeeklyEmissions(
            Long userId, LocalDate date) {

        LocalDate startDate = date.with(
                TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        BigDecimal total =
                activityLogRepository.sumEmissionsByUserAndDateRange(
                        userId, startDate, startDate.plusWeeks(1));

        return createResponse(userId, total, "weekly", startDate);
    }

    @Cacheable(
            cacheNames = "analytics",
            key = "#userId + ':monthly:' + #date"
    )
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyEmissions(
            Long userId, LocalDate date) {

        LocalDate startDate = date.withDayOfMonth(1);

        BigDecimal total =
                activityLogRepository.sumEmissionsByUserAndDateRange(
                        userId, startDate, startDate.plusMonths(1));

        return createResponse(userId, total, "monthly", startDate);
    }

    private Map<String, Object> createResponse(
            Long userId,
            BigDecimal total,
            String period,
            LocalDate date) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put(
                "co2eKg",
                total != null ? total : BigDecimal.ZERO);

        response.put("period", period);
        response.put("date", date);
        response.put("userId", userId);

        return response;
    }
}
