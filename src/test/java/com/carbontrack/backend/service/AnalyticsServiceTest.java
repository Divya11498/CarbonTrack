package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityCategory;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.ActivityType;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.UserProfile;
import com.carbontrack.backend.repository.ActivityCategoryRepository;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.ActivityTypeRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private ActivityCategoryRepository categoryRepository;
    @Mock
    private ActivityTypeRepository typeRepository;
    @Mock
    private GoalRepository goalRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void resolveDateRange_handlesAllSupportedPeriodsAndCustomSwap() {
        LocalDate today = LocalDate.now();

        LocalDate[] todayRange = analyticsService.resolveDateRange("today", null, null);
        assertEquals(today, todayRange[0]);
        assertEquals(today, todayRange[1]);

        LocalDate[] weekRange = analyticsService.resolveDateRange("7d", null, null);
        assertEquals(today.minusDays(6), weekRange[0]);
        assertEquals(today, weekRange[1]);

        LocalDate[] thirtyRange = analyticsService.resolveDateRange("30d", null, null);
        assertEquals(today.minusDays(29), thirtyRange[0]);
        assertEquals(today, thirtyRange[1]);

        LocalDate[] thisMonth = analyticsService.resolveDateRange("this_month", null, null);
        assertEquals(today.withDayOfMonth(1), thisMonth[0]);
        assertEquals(today, thisMonth[1]);

        LocalDate[] prevMonth = analyticsService.resolveDateRange("prev_month", null, null);
        LocalDate expectedPrevStart = today.withDayOfMonth(1).minusMonths(1);
        assertEquals(expectedPrevStart, prevMonth[0]);
        assertEquals(expectedPrevStart.withDayOfMonth(expectedPrevStart.lengthOfMonth()), prevMonth[1]);

        // Reversed custom dates are normalized automatically
        LocalDate[] custom = analyticsService.resolveDateRange("custom", "2026-04-20", "2026-04-05");
        assertEquals(LocalDate.of(2026, 4, 5), custom[0]);
        assertEquals(LocalDate.of(2026, 4, 20), custom[1]);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getSummaryAndTrends_computesPeriodDeltasCategoriesAndSeries() {
        Long userId = 42L;
        LocalDate today = LocalDate.now();

        ActivityCategory transportCat = mock(ActivityCategory.class);
        when(transportCat.getId()).thenReturn((short) 1);
        when(transportCat.getName()).thenReturn("Transport");

        ActivityType carType = mock(ActivityType.class);
        when(carType.getId()).thenReturn((short) 1);
        when(carType.getName()).thenReturn("Car Commute");

        ActivityLog logToday = new ActivityLog();
        logToday.setUserId(userId);
        logToday.setCategoryId((short) 1);
        logToday.setActivityTypeId((short) 1);
        logToday.setLogDate(today);
        logToday.setQuantity(new BigDecimal("10"));
        logToday.setUnit("km");
        logToday.setCo2eKg(new BigDecimal("12.00"));

        ActivityLog logPrevWeek = new ActivityLog();
        logPrevWeek.setUserId(userId);
        logPrevWeek.setCategoryId((short) 1);
        logPrevWeek.setActivityTypeId((short) 1);
        logPrevWeek.setLogDate(today.minusDays(8));
        logPrevWeek.setQuantity(new BigDecimal("20"));
        logPrevWeek.setUnit("km");
        logPrevWeek.setCo2eKg(new BigDecimal("24.00"));

        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setMonthlyTargetKgco2e(new BigDecimal("200.00"));

        Goal achievedGoal = new Goal();
        achievedGoal.setUserId(userId);
        achievedGoal.setStatus("ACHIEVED");

        when(activityLogRepository.findByUserId(userId)).thenReturn(List.of(logToday, logPrevWeek));
        when(userProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(categoryRepository.findAll()).thenReturn(List.of(transportCat));
        when(typeRepository.findAll()).thenReturn(List.of(carType));
        when(goalRepository.findByUserId(userId)).thenReturn(List.of(achievedGoal));

        Map<String, Object> summary = analyticsService.getSummary(userId, "7d", null, null);
        assertEquals(0, new BigDecimal("12.00").compareTo((BigDecimal) summary.get("totalCo2eKg")));
        assertEquals(0, new BigDecimal("24.00").compareTo((BigDecimal) summary.get("previousPeriodCo2eKg")));
        assertEquals(-50.0, (Double) summary.get("periodDeltaPercent"));
        assertEquals(1L, summary.get("achievedGoalsCount"));

        Map<String, Object> trends = analyticsService.getTrends(userId, "7d", null, null);
        List<Map<String, Object>> trendPoints = (List<Map<String, Object>>) trends.get("trend");
        List<Map<String, Object>> weeklyComp = (List<Map<String, Object>>) trends.get("weeklyComparison");
        List<Map<String, Object>> historical = (List<Map<String, Object>>) trends.get("historicalEmissions");
        List<Map<String, Object>> categorySeries = (List<Map<String, Object>>) trends.get("categorySeries");

        assertEquals(7, trendPoints.size());
        assertEquals(7, weeklyComp.size());
        assertEquals(6, historical.size());
        assertEquals(1, categorySeries.size());
        assertEquals("Transport", categorySeries.get(0).get("name"));
    }
}
