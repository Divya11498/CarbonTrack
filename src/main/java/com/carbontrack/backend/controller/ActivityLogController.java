
package com.carbontrack.backend.controller;

import com.carbontrack.backend.dto.ActivityLogRequest;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.ActivityLogService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        ActivityLog activity = new ActivityLog();

        // Always use the authenticated user's ID
        activity.setUserId(user.getId());
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

    // Return only the authenticated user's activities
    @GetMapping
    public ResponseEntity<?> getAllActivities(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        List<ActivityLog> activities =
                activityLogService.getActivitiesByUserId(user.getId());

        return ResponseEntity.ok(activities);
    }

    // Return activities only when the requested ID belongs to the user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getActivitiesByUserId(
            @PathVariable Long userId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        if (userId == null || !user.getId().equals(userId)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("You are not allowed to access another user's activities.");
        }

        List<ActivityLog> activities =
                activityLogService.getActivitiesByUserId(user.getId());

        return ResponseEntity.ok(activities);
    }

    // Resolve the user from the authenticated JWT identity
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
