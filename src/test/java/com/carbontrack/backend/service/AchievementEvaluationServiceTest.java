package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.entity.UserProfile;
import com.carbontrack.backend.event.ActivityLoggedEvent;
import com.carbontrack.backend.event.GoalUpdatedEvent;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.BadgeRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.UserBadgeRepository;
import com.carbontrack.backend.repository.UserProfileRepository;
import com.carbontrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AchievementEvaluationServiceTest {

    @Mock
    private BadgeRepository badgeRepository;
    @Mock
    private UserBadgeRepository userBadgeRepository;
    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private GoalRepository goalRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AchievementEvaluationService achievementService;

    private Badge mockBadge(short id, String code, String name) {
        Badge badge = mock(Badge.class);
        lenient().when(badge.getId()).thenReturn(id);
        lenient().when(badge.getCode()).thenReturn(code);
        lenient().when(badge.getName()).thenReturn(name);
        return badge;
    }

    @Test
    void onActivityLogged_awardsStreakAndReductionBadgesWithoutDuplicates() {
        Long userId = 7L;
        Badge ecoPioneer = mockBadge((short) 1, "eco_pioneer", "Eco Pioneer");
        Badge weekWarrior = mockBadge((short) 2, "week_warrior", "Week Warrior");
        Badge reduction10 = mockBadge((short) 3, "reduction_10kg", "10kg Saver");

        List<ActivityLog> logs = new ArrayList<>();
        LocalDate baseDate = LocalDate.now().withDayOfMonth(1);
        for (int i = 0; i < 7; i++) {
            ActivityLog log = new ActivityLog();
            log.setUserId(userId);
            log.setCategoryId((short) 1);
            log.setActivityTypeId((short) 1);
            log.setLogDate(baseDate.plusDays(i));
            log.setQuantity(new BigDecimal("2.0"));
            log.setUnit("km");
            log.setCo2eKg(new BigDecimal("1.00"));
            logs.add(log);
        }

        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setMonthlyTargetKgco2e(new BigDecimal("200.00"));

        User user = new User();
        user.setId(userId);
        user.setEmail("eco@carbontrack.test");

        when(badgeRepository.findAll()).thenReturn(List.of(ecoPioneer, weekWarrior, reduction10));
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
        when(userBadgeRepository.findByUserIdAndBadgeId(eq(userId), any())).thenReturn(Optional.empty());
        when(activityLogRepository.findByUserId(userId)).thenReturn(logs);
        when(goalRepository.findByUserId(userId)).thenReturn(List.of());
        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        achievementService.onActivityLogged(new ActivityLoggedEvent(userId, 100L, "CREATED"));

        verify(userBadgeRepository, times(3)).save(any(UserBadge.class));
        verify(emailService, times(3)).sendAchievementUnlocked(eq(user), any(Badge.class));

        // Second evaluation with already-earned badges must NOT duplicate inserts
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of(
                new UserBadge(userId, (short) 1, "ACTIVITY_CREATED"),
                new UserBadge(userId, (short) 2, "ACTIVITY_CREATED"),
                new UserBadge(userId, (short) 3, "ACTIVITY_CREATED")
        ));
        List<Badge> secondAward = achievementService.evaluateAndAwardForUser(userId, "ACTIVITY_CREATED");
        assertTrue(secondAward.isEmpty());
        verifyNoMoreInteractions(emailService);
    }

    @Test
    void onGoalUpdated_awardsFirstGoalAchievedAndReportsProgress() {
        Long userId = 9L;
        Badge goalBadge = mockBadge((short) 4, "first_goal_achieved", "Goal Getter");
        Badge reduction50 = mockBadge((short) 5, "reduction_50kg", "50kg Saver");

        Goal achievedGoal = new Goal();
        achievedGoal.setUserId(userId);
        achievedGoal.setStatus("ACHIEVED");

        when(badgeRepository.findAll()).thenReturn(List.of(goalBadge, reduction50));
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
        when(userBadgeRepository.findByUserIdAndBadgeId(userId, (short) 4)).thenReturn(Optional.empty());
        when(activityLogRepository.findByUserId(userId)).thenReturn(List.of());
        when(goalRepository.findByUserId(userId)).thenReturn(List.of(achievedGoal));
        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        achievementService.onGoalUpdated(new GoalUpdatedEvent(userId, 55L, "ACHIEVED"));

        verify(userBadgeRepository, times(1)).save(any(UserBadge.class));

        when(userBadgeRepository.findByUserId(userId))
                .thenReturn(List.of(new UserBadge(userId, (short) 4, "GOAL_ACHIEVED")));
        List<Map<String, Object>> badgeProgress = achievementService.getUserBadgesWithProgress(userId);
        assertEquals(2, badgeProgress.size());
        assertEquals(true, badgeProgress.get(0).get("unlocked"));
        assertEquals(100, badgeProgress.get(0).get("progressPercent"));
        assertEquals(false, badgeProgress.get(1).get("unlocked"));
        assertEquals(0, badgeProgress.get(1).get("progressPercent"));
    }
}
