package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityCategory;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.ActivityType;
import com.carbontrack.backend.event.ActivityLoggedEvent;
import com.carbontrack.backend.repository.ActivityCategoryRepository;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.ActivityTypeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final EmissionCalculationService emissionCalculationService;
    private final ActivityTypeRepository activityTypeRepository;
    private final ActivityCategoryRepository activityCategoryRepository;

    @Autowired(required = false)
    private ApplicationEventPublisher eventPublisher;

    @Autowired(required = false)
    private CacheEvictionService cacheEvictionService;

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

        ActivityLog saved = activityLogRepository.save(activityLog);
        publishActivityChange(saved.getUserId(), saved.getId(), "CREATED");
        return saved;
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

        ActivityLog saved = activityLogRepository.save(existing);
        publishActivityChange(saved.getUserId(), saved.getId(), "UPDATED");
        return saved;
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
        publishActivityChange(userId, id, "DELETED");
    }

    private void publishActivityChange(Long userId, Long activityId, String actionType) {
        if (cacheEvictionService != null) {
            cacheEvictionService.evictActivityDerivedCaches();
        }
        if (eventPublisher != null && userId != null) {
            eventPublisher.publishEvent(new ActivityLoggedEvent(userId, activityId, actionType));
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFrequentActivities(Long userId) {
        if (userId == null || userId <= 0) {
            return List.of();
        }
        List<ActivityLog> logs = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
        if (logs.isEmpty()) {
            return List.of();
        }

        Map<Short, ActivityType> typeMap = activityTypeRepository.findByIsActiveTrue().stream()
                .collect(Collectors.toMap(ActivityType::getId, t -> t));
        Map<Short, ActivityCategory> catMap = activityCategoryRepository.findAll().stream()
                .collect(Collectors.toMap(ActivityCategory::getId, c -> c));

        Map<Short, List<ActivityLog>> grouped = logs.stream()
                .collect(Collectors.groupingBy(ActivityLog::getActivityTypeId));

        return grouped.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(6)
                .map(entry -> {
                    ActivityType t = typeMap.get(entry.getKey());
                    List<ActivityLog> items = entry.getValue();
                    ActivityLog latest = items.get(0);
                    ActivityCategory cat = catMap.get(latest.getCategoryId());
                    Map<String, Object> m = new HashMap<>();
                    m.put("activityTypeId", entry.getKey());
                    m.put("categoryId", latest.getCategoryId());
                    m.put("categoryName", cat != null ? cat.getName() : "transport");
                    m.put("activityName", t != null ? t.getName() : "Activity #" + entry.getKey());
                    m.put("unit", latest.getUnit());
                    m.put("defaultQuantity", latest.getQuantity());
                    m.put("co2eKg", latest.getCo2eKg());
                    m.put("count", items.size());
                    return m;
                })
                .toList();
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
