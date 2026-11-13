package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.NotificationLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.NotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private NotificationLogRepository notificationLogRepository;

    @InjectMocks
    private EmailService emailService;

    private User testUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "mailHost", "");
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@carbontrack.local");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");

        testUser = new User();
        testUser.setId(15L);
        testUser.setEmail("alice@carbontrack.test");
        testUser.setDisplayName("Alice Green");
        testUser.setEmailNotifications(true);
        testUser.setGoalAlertsEnabled(true);
        testUser.setWeeklyReportEnabled(true);
    }

    @Test
    void rendersResponsiveHtmlTemplatesForAllNotificationTypes() {
        Goal goal = new Goal();
        goal.setId(101L);
        goal.setTitle("Cut Commute Emissions");
        goal.setTargetValue(new BigDecimal("100.00"));

        String welcomeHtml = emailService.renderWelcomeEmail(testUser);
        assertTrue(welcomeHtml.contains("Alice Green"));
        assertTrue(welcomeHtml.contains("CarbonTrack"));

        String resetHtml = emailService.renderPasswordResetEmail(testUser, "tok-abc-123");
        assertTrue(resetHtml.contains("tok-abc-123"));
        assertTrue(resetHtml.contains("Reset Password"));

        String achievedHtml = emailService.renderGoalAchievedEmail(testUser, goal, new BigDecimal("72.5"));
        assertTrue(achievedHtml.contains("Cut Commute Emissions"));
        assertTrue(achievedHtml.contains("72.5"));

        String alertHtml = emailService.renderGoalCorrectionAlertEmail(testUser, goal, new BigDecimal("88.0"), 125.4);
        assertTrue(alertHtml.contains("125.4"));
        assertTrue(alertHtml.contains("Cut Commute Emissions"));

        String weeklyHtml = emailService.renderWeeklyInsightsEmail(testUser, new BigDecimal("28.4"), new BigDecimal("35.0"), "Transport");
        assertTrue(weeklyHtml.contains("Transport"));
        assertTrue(weeklyHtml.contains("28.4"));
    }

    @Test
    void dispatchHandlesUnconfiguredSmtpOptOutAndDeduplicationSafely() {
        when(notificationLogRepository.existsByUserIdAndNotificationTypeAndReferenceKey(
                15L, "WELCOME", "welcome-15")).thenReturn(false);

        Map<String, Object> result = emailService.sendWelcomeEmail(testUser);
        assertEquals("SMTP_NOT_CONFIGURED", result.get("status"));
        verify(notificationLogRepository, times(1)).save(any(NotificationLog.class));

        // Subsequent duplicate check prevents repeat delivery
        when(notificationLogRepository.existsByUserIdAndNotificationTypeAndReferenceKey(
                15L, "WELCOME", "welcome-15")).thenReturn(true);
        Map<String, Object> dupResult = emailService.sendWelcomeEmail(testUser);
        assertEquals("DEDUPLICATED", dupResult.get("status"));

        // Opt-out disables weekly digest delivery
        testUser.setWeeklyReportEnabled(false);
        Map<String, Object> skipped = emailService.sendWeeklyInsightsEmail(
                testUser, new BigDecimal("10"), new BigDecimal("12"), "Food");
        assertEquals("SKIPPED_BY_PREFERENCE", skipped.get("status"));

        // Achievement unlock logs safely when SMTP unconfigured
        Badge badge = mock(Badge.class);
        when(badge.getCode()).thenReturn("eco_pioneer");
        when(badge.getName()).thenReturn("Eco Pioneer");
        when(notificationLogRepository.existsByUserIdAndNotificationTypeAndReferenceKey(
                15L, "ACHIEVEMENT_UNLOCKED", "badge-eco_pioneer")).thenReturn(false);

        Map<String, Object> badgeMail = emailService.sendAchievementUnlocked(testUser, badge);
        assertEquals("SMTP_NOT_CONFIGURED", badgeMail.get("status"));
    }
}
