package com.carbontrack.backend.event;

public record GoalUpdatedEvent(Long userId, Long goalId, String status) {
}
