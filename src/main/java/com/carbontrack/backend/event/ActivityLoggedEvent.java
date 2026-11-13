package com.carbontrack.backend.event;

public record ActivityLoggedEvent(Long userId, Long activityId, String actionType) {
}
