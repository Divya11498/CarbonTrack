
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.event.ActivityLoggedEvent;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.BadgeRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class BadgeEventListener {

    private final ActivityLogRepository activityLogRepository;
    private final BadgeService badgeService;
    private final BadgeRepository badgeRepository;

    public BadgeEventListener(
            ActivityLogRepository activityLogRepository,
            BadgeService badgeService,
            BadgeRepository badgeRepository) {
        this.activityLogRepository = activityLogRepository;
        this.badgeService = badgeService;
        this.badgeRepository = badgeRepository;
    }

    @EventListener
    @Transactional
    public void handleActivityLogged(ActivityLoggedEvent event) {
        if (event == null || event.getUserId() == null
                || event.getLogDate() == null) {
            return;
        }

        awardSevenDayStreakBadge(
                event.getUserId(),
                event.getLogDate()
        );
    }

    private void awardSevenDayStreakBadge(
            Long userId, LocalDate logDate) {

        List<ActivityLog> activities =
                activityLogRepository.findByUserId(userId);

        Set<LocalDate> activityDates = activities.stream()
                .map(ActivityLog::getLogDate)
                .filter(date -> date != null)
                .collect(Collectors.toSet());

        boolean sevenConsecutiveDays = true;

        for (int i = 0; i < 7; i++) {
            if (!activityDates.contains(logDate.minusDays(i))) {
                sevenConsecutiveDays = false;
                break;
            }
        }

        if (sevenConsecutiveDays
                && badgeRepository.findByCode("week_warrior")
                .isPresent()) {
            badgeService.awardBadge(userId, "week_warrior");
        }
    }
}
