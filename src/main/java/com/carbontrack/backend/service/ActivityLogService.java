package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityCategory;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.ActivityType;
import com.carbontrack.backend.repository.ActivityCategoryRepository;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.ActivityTypeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final EmissionCalculationService emissionCalculationService;
    private final ActivityTypeRepository activityTypeRepository;
    private final ActivityCategoryRepository activityCategoryRepository;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            EmissionCalculationService emissionCalculationService,
            ActivityTypeRepository activityTypeRepository,
            ActivityCategoryRepository activityCategoryRepository) {

        this.activityLogRepository = activityLogRepository;
        this.emissionCalculationService = emissionCalculationService;
        this.activityTypeRepository = activityTypeRepository;
        this.activityCategoryRepository = activityCategoryRepository;
    }

    // Create a new activity and calculate its emissions
    @Transactional
    public ActivityLog createActivity(ActivityLog activityLog) {
        if (activityLog == null) {
            throw new IllegalArgumentException("Activity log cannot be null.");
        }

        LocalDate date = activityLog.getLogDate() != null ? activityLog.getLogDate() : LocalDate.now();
        activityLog.setLogDate(date);

        EmissionCalculationResult result =
                emissionCalculationService.calculateEmission(
                        activityLog.getActivityTypeId(),
                        activityLog.getQuantity(),
                        activityLog.getUnit(),
                        date
                );

        activityLog.setCo2eKg(result.co2eKg());
        activityLog.setEmissionFactorId(result.emissionFactorId());

        return activityLogRepository.save(activityLog);
    }

    // Calculate CO2 without saving to database (real-time preview)
    public EmissionCalculationResult calculatePreview(
            Short activityTypeId,
            BigDecimal quantity,
            String unit,
            LocalDate logDate) {
        LocalDate date = logDate != null ? logDate : LocalDate.now();
        return emissionCalculationService.calculateEmission(activityTypeId, quantity, unit, date);
    }

    // Update an existing activity (verifying user ownership)
    @Transactional
    public ActivityLog updateActivity(Long id, Long userId, ActivityLog updated) {
        ActivityLog existing = activityLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found with id: " + id));

        if (!existing.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to edit this activity.");
        }

        LocalDate date = updated.getLogDate() != null ? updated.getLogDate() : existing.getLogDate();

        EmissionCalculationResult result =
                emissionCalculationService.calculateEmission(
                        updated.getActivityTypeId(),
                        updated.getQuantity(),
                        updated.getUnit(),
                        date
                );

        existing.setCategoryId(updated.getCategoryId());
        existing.setActivityTypeId(updated.getActivityTypeId());
        existing.setQuantity(updated.getQuantity());
        existing.setUnit(updated.getUnit());
        existing.setLogDate(date);
        existing.setNotes(updated.getNotes());
        existing.setCo2eKg(result.co2eKg());
        existing.setEmissionFactorId(result.emissionFactorId());

        return activityLogRepository.save(existing);
    }

    // Delete an activity (verifying user ownership)
    @Transactional
    public void deleteActivity(Long id, Long userId) {
        ActivityLog existing = activityLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found with id: " + id));

        if (!existing.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to delete this activity.");
        }

        activityLogRepository.delete(existing);
    }

    // Get all activities
    @Transactional(readOnly = true)
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findAll();
    }

    // Get activities for a specific user ordered by latest date
    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("User ID must be a positive number.");
        }
        return activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
    }

    // Get all active activity types
    @Transactional(readOnly = true)
    public List<ActivityType> getActivityTypes() {
        return activityTypeRepository.findByIsActiveTrue();
    }

    // Get all categories
    @Transactional(readOnly = true)
    public List<ActivityCategory> getCategories() {
        return activityCategoryRepository.findAll();
    }
}
