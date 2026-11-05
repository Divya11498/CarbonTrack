package com.carbontrack.backend.controller;

import com.carbontrack.backend.dto.ActivityLogRequest;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.ActivityLogService;
import com.carbontrack.backend.service.EmissionCalculationResult;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;

    public ActivityLogController(
            ActivityLogService activityLogService,
            UserRepository userRepository) {
        this.activityLogService = activityLogService;
        this.userRepository = userRepository;
    }

    // Create an activity for the authenticated user
    @PostMapping
    public ResponseEntity<?> createActivity(
            @Valid @RequestBody ActivityLogRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ActivityLog activity = new ActivityLog();
        activity.setUserId(user.getId());
        activity.setCategoryId(request.getCategoryId());
        activity.setActivityTypeId(request.getActivityTypeId());
        activity.setQuantity(request.getQuantity());
        activity.setUnit(request.getUnit());
        activity.setLogDate(request.getLogDate() != null ? request.getLogDate() : LocalDate.now());
        activity.setOrganizationId(request.getOrganizationId());
        activity.setNotes(request.getNotes());

        ActivityLog savedActivity = activityLogService.createActivity(activity);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedActivity);
    }

    // Real-time calculation preview without saving
    @PostMapping("/calculate-preview")
    public ResponseEntity<?> calculatePreview(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        if (payload.get("activityTypeId") == null || payload.get("quantity") == null || payload.get("unit") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "activityTypeId, quantity, and unit are required"));
        }

        Short activityTypeId = Short.valueOf(payload.get("activityTypeId").toString());
        BigDecimal quantity = new BigDecimal(payload.get("quantity").toString());
        String unit = payload.get("unit").toString();
        LocalDate logDate = payload.get("logDate") != null
                ? LocalDate.parse(payload.get("logDate").toString())
                : LocalDate.now();

        try {
            EmissionCalculationResult result =
                    activityLogService.calculatePreview(activityTypeId, quantity, unit, logDate);

            return ResponseEntity.ok(Map.of(
                    "co2eKg", result.co2eKg(),
                    "emissionFactorId", result.emissionFactorId() != null ? result.emissionFactorId() : 0
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // Return authenticated user's activities
    @GetMapping
    public ResponseEntity<?> getAllActivities(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ActivityLog> activities = activityLogService.getActivitiesByUserId(user.getId());
        return ResponseEntity.ok(activities);
    }

    // Return activities for specific user (ownership check)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getActivitiesByUserId(
            @PathVariable Long userId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!user.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You are not allowed to access another user's activities."));
        }

        List<ActivityLog> activities = activityLogService.getActivitiesByUserId(user.getId());
        return ResponseEntity.ok(activities);
    }

    // Edit an activity
    @PutMapping("/{id}")
    public ResponseEntity<?> updateActivity(
            @PathVariable Long id,
            @Valid @RequestBody ActivityLogRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ActivityLog updated = new ActivityLog();
        updated.setCategoryId(request.getCategoryId());
        updated.setActivityTypeId(request.getActivityTypeId());
        updated.setQuantity(request.getQuantity());
        updated.setUnit(request.getUnit());
        updated.setLogDate(request.getLogDate() != null ? request.getLogDate() : LocalDate.now());
        updated.setNotes(request.getNotes());

        try {
            ActivityLog saved = activityLogService.updateActivity(id, user.getId(), updated);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // Delete an activity
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteActivity(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            activityLogService.deleteActivity(id, user.getId());
            return ResponseEntity.ok(Map.of("message", "Activity deleted successfully", "id", id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // Get active activity types
    @GetMapping("/types")
    public ResponseEntity<?> getActivityTypes() {
        return ResponseEntity.ok(activityLogService.getActivityTypes());
    }

    // Get categories
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(activityLogService.getCategories());
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            return null;
        }

        return userRepository
                .findByEmail(authentication.getName())
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .orElse(null);
    }
}
