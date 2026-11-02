
package com.carbontrack.backend.event;

import java.time.LocalDate;

public class ActivityLoggedEvent {

    private final Long userId;
    private final LocalDate logDate;

    public ActivityLoggedEvent(Long userId, LocalDate logDate) {
        this.userId = userId;
        this.logDate = logDate;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalDate getLogDate() {
        return logDate;
    }
}
