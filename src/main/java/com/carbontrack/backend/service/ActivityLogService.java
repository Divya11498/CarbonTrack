
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.repository.ActivityLogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // Create a new activity and calculate its emissions
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
                        activityLog.getLogDate()
                );

        activityLog.setCo2eKg(result.co2eKg());
        activityLog.setEmissionFactorId(result.emissionFactorId());

        return activityLogRepository.save(activityLog);
    }

    // Get all activities
    @Transactional(readOnly = true)
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findAll();
    }

    // Get activities for a specific user
    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByUserId(Long userId) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "User ID must be a positive number.");
        }

        return activityLogRepository.findByUserId(userId);
    }
}
