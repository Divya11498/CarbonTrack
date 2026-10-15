
package com.carbontrack.backend.controller;

import com.carbontrack.backend.dto.ActivityLogRequest;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.service.ActivityLogService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(
            ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    // Create a new activity
    @PostMapping
    public ResponseEntity<ActivityLog> createActivity(
            @Valid @RequestBody ActivityLogRequest request) {

        ActivityLog activity = new ActivityLog();

        activity.setUserId(request.getUserId());
        activity.setCategoryId(request.getCategoryId());
        activity.setActivityTypeId(request.getActivityTypeId());
        activity.setQuantity(request.getQuantity());
        activity.setUnit(request.getUnit());
        activity.setLogDate(request.getLogDate());
        activity.setOrganizationId(request.getOrganizationId());
        activity.setNotes(request.getNotes());

        ActivityLog savedActivity =
                activityLogService.createActivity(activity);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedActivity);
    }

    // Get all activities
    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAllActivities() {
        List<ActivityLog> activities =
                activityLogService.getAllActivities();

        return ResponseEntity.ok(activities);
    }

    // Get activities for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityLog>> getActivitiesByUserId(
            @PathVariable Long userId) {

        List<ActivityLog> activities =
                activityLogService.getActivitiesByUserId(userId);

        return ResponseEntity.ok(activities);
    }
}
