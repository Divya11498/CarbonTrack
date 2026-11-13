package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.NotificationLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.NotificationLogRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final NotificationLogRepository notificationLogRepository;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:no-reply@carbontrack.local}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            NotificationLogRepository notificationLogRepository) {
        this.mailSenderProvider = mailSenderProvider;
        this.notificationLogRepository = notificationLogRepository;
    }

    public boolean isSmtpConfigured() {
        return mailHost != null && !mailHost.isBlank() && mailSenderProvider.getIfAvailable() != null;
    }

    public Map<String, Object> sendWelcomeEmail(User user) {
        String subject = "Welcome to CarbonTrack — Start Tracking Your Impact";
        String html = renderWelcomeEmail(user);
        return dispatch(user, "WELCOME", "welcome-" + user.getId(), subject, html, true);
    }

    public Map<String, Object> sendPasswordResetEmail(User user, String resetToken) {
        String subject = "CarbonTrack Password Reset Request";
        String html = renderPasswordResetEmail(user, resetToken);
        return dispatch(user, "PASSWORD_RESET", "reset-" + System.currentTimeMillis(), subject, html, false);
    }

    public Map<String, Object> sendGoalAchievedEmail(User user, Goal goal, BigDecimal actualCo2e) {
        if (!Boolean.TRUE.equals(user.getGoalAlertsEnabled())) {
            return Map.of("status", "SKIPPED_BY_PREFERENCE");
        }
        String subject = "Goal Achieved: " + goal.getTitle();
        String html = renderGoalAchievedEmail(user, goal, actualCo2e);
        return dispatch(user, "GOAL_ACHIEVED", "goal-achieved-" + goal.getId(), subject, html, true);
    }

    public Map<String, Object> sendGoalCorrectionAlert(User user, Goal goal, BigDecimal actualCo2e, double projectedCo2e) {
        if (!Boolean.TRUE.equals(user.getGoalAlertsEnabled())) {
            return Map.of("status", "SKIPPED_BY_PREFERENCE");
        }
        String refKey = "goal-alert-" + goal.getId() + "-" + LocalDate.now().withDayOfMonth(1);
        String subject = "Sustainability Alert: Stay on Track for \"" + goal.getTitle() + "\"";
        String html = renderGoalCorrectionAlertEmail(user, goal, actualCo2e, projectedCo2e);
        return dispatch(user, "GOAL_CORRECTION_ALERT", refKey, subject, html, true);
    }

    public Map<String, Object> sendAchievementUnlocked(User user, Badge badge) {
        String subject = "Achievement Unlocked: " + badge.getName();
        String html = renderAchievementUnlockedEmail(user, badge);
        return dispatch(user, "ACHIEVEMENT_UNLOCKED", "badge-" + badge.getCode(), subject, html, true);
    }

    public Map<String, Object> sendWeeklyInsightsEmail(User user, BigDecimal weekCo2e, BigDecimal prevWeekCo2e, String topCategory) {
        if (!Boolean.TRUE.equals(user.getWeeklyReportEnabled())) {
            return Map.of("status", "SKIPPED_BY_PREFERENCE");
        }
        String refKey = "weekly-" + LocalDate.now();
        String subject = "Your Weekly CarbonTrack Sustainability Insights";
        String html = renderWeeklyInsightsEmail(user, weekCo2e, prevWeekCo2e, topCategory);
        return dispatch(user, "WEEKLY_INSIGHTS", refKey, subject, html, true);
    }

    public String renderWelcomeEmail(User user) {
        String name = safeName(user);
        String body = "<p>Hi <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p>Welcome to <strong>CarbonTrack</strong>! Your account is ready to log daily transport, electricity, diet, shopping, and waste activities with live CO2e analytics.</p>"
                + "<ul style=\"padding-left:20px;line-height:1.7;\">"
                + "<li>Log your first activity to unlock the <em>Eco Pioneer</em> badge.</li>"
                + "<li>Set a monthly or weekly reduction goal on the Goals page.</li>"
                + "<li>Ask CarbonTrack AI for personalized low-carbon swaps anytime.</li>"
                + "</ul>";
        return wrapLayout("Welcome to CarbonTrack", body, "Open Dashboard", frontendUrl);
    }

    public String renderPasswordResetEmail(User user, String resetToken) {
        String name = safeName(user);
        String resetUrl = frontendUrl + "?resetToken=" + escapeHtml(resetToken);
        String body = "<p>Hi <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p>We received a request to reset your CarbonTrack password. Use the button below or paste your reset token in the app (valid for 30 minutes):</p>"
                + "<p style=\"background:#f4efe4;border:1px solid #cfc6b1;padding:10px 14px;border-radius:8px;font-family:monospace;word-break:break-all;\">"
                + escapeHtml(resetToken) + "</p>"
                + "<p>If you did not request this change, you can safely ignore this email.</p>";
        return wrapLayout("Reset Your Password", body, "Reset Password", resetUrl);
    }

    public String renderGoalAchievedEmail(User user, Goal goal, BigDecimal actualCo2e) {
        String name = safeName(user);
        String actualStr = actualCo2e != null ? actualCo2e.setScale(1, RoundingMode.HALF_UP).toString() : "0.0";
        String targetStr = goal.getTargetValue() != null ? goal.getTargetValue().setScale(1, RoundingMode.HALF_UP).toString() : "0.0";
        String body = "<p>Congratulations <strong>" + escapeHtml(name) + "</strong>!</p>"
                + "<p>You achieved your sustainability goal <strong>" + escapeHtml(goal.getTitle()) + "</strong>.</p>"
                + "<div style=\"background:#edf3e8;border-left:4px solid #6b7b4c;padding:12px 16px;border-radius:6px;margin:16px 0;\">"
                + "<strong>Actual Emissions:</strong> " + actualStr + " kg CO2e<br/>"
                + "<strong>Target Cap:</strong> " + targetStr + " " + escapeHtml(goal.getTargetUnit())
                + "</div>"
                + "<p>Keep your streak going and inspect your new milestones in the Achievements tab.</p>";
        return wrapLayout("Sustainability Goal Achieved", body, "View Your Goals", frontendUrl);
    }

    public String renderGoalCorrectionAlertEmail(User user, Goal goal, BigDecimal actualCo2e, double projectedCo2e) {
        String name = safeName(user);
        String actualStr = actualCo2e != null ? actualCo2e.setScale(1, RoundingMode.HALF_UP).toString() : "0.0";
        String targetStr = goal.getTargetValue() != null ? goal.getTargetValue().setScale(1, RoundingMode.HALF_UP).toString() : "0.0";
        String projStr = BigDecimal.valueOf(projectedCo2e).setScale(1, RoundingMode.HALF_UP).toString();
        String body = "<p>Hi <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p>Your current pace for <strong>" + escapeHtml(goal.getTitle()) + "</strong> is projected to exceed your target.</p>"
                + "<div style=\"background:#f9ebe6;border-left:4px solid #b54e48;padding:12px 16px;border-radius:6px;margin:16px 0;\">"
                + "<strong>Logged So Far:</strong> " + actualStr + " kg CO2e<br/>"
                + "<strong>Projected Period Total:</strong> " + projStr + " kg CO2e<br/>"
                + "<strong>Target Limit:</strong> " + targetStr + " " + escapeHtml(goal.getTargetUnit())
                + "</div>"
                + "<p>Open AI Recommendations for fast, high-impact swaps to get back on track.</p>";
        return wrapLayout("Goal Pace Alert", body, "Review Recommendations", frontendUrl);
    }

    public String renderAchievementUnlockedEmail(User user, Badge badge) {
        String name = safeName(user);
        String body = "<p>Way to go, <strong>" + escapeHtml(name) + "</strong>!</p>"
                + "<p>You unlocked a new sustainability badge:</p>"
                + "<div style=\"background:#f4efe4;border:1px solid #cfc6b1;padding:14px 16px;border-radius:10px;margin:16px 0;\">"
                + "<h3 style=\"margin:0 0 6px;color:#2d2821;\">" + escapeHtml(badge.getName()) + "</h3>"
                + "<p style=\"margin:0;color:#5c5549;\">" + escapeHtml(badge.getDescription()) + "</p>"
                + "</div>";
        return wrapLayout("Achievement Unlocked!", body, "View Achievements", frontendUrl);
    }

    public String renderWeeklyInsightsEmail(User user, BigDecimal weekCo2e, BigDecimal prevWeekCo2e, String topCategory) {
        String name = safeName(user);
        String w = weekCo2e != null ? weekCo2e.setScale(1, RoundingMode.HALF_UP).toString() : "0.0";
        String pw = prevWeekCo2e != null ? prevWeekCo2e.setScale(1, RoundingMode.HALF_UP).toString() : "0.0";
        String cat = topCategory != null ? topCategory : "General";
        String body = "<p>Hi <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p>Here is your weekly CarbonTrack sustainability digest:</p>"
                + "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;margin:16px 0;\">"
                + "<tr><td style=\"padding:8px;border:1px solid #ded6c1;\"><strong>This Week</strong></td><td style=\"padding:8px;border:1px solid #ded6c1;\">" + w + " kg CO2e</td></tr>"
                + "<tr><td style=\"padding:8px;border:1px solid #ded6c1;\"><strong>Previous Week</strong></td><td style=\"padding:8px;border:1px solid #ded6c1;\">" + pw + " kg CO2e</td></tr>"
                + "<tr><td style=\"padding:8px;border:1px solid #ded6c1;\"><strong>Highest Contributor</strong></td><td style=\"padding:8px;border:1px solid #ded6c1;\">" + escapeHtml(cat) + "</td></tr>"
                + "</table>"
                + "<p>Log today's activities and check Analytics for your updated category breakdown.</p>";
        return wrapLayout("Weekly Sustainability Insights", body, "Open Analytics", frontendUrl);
    }

    private Map<String, Object> dispatch(
            User user,
            String notificationType,
            String referenceKey,
            String subject,
            String htmlBody,
            boolean checkEmailOptIn) {

        if (user == null || user.getEmail() == null) {
            return Map.of("status", "SKIPPED_NO_RECIPIENT");
        }
        if (checkEmailOptIn && !Boolean.TRUE.equals(user.getEmailNotifications())) {
            return Map.of("status", "SKIPPED_BY_PREFERENCE");
        }
        if (notificationLogRepository.existsByUserIdAndNotificationTypeAndReferenceKey(
                user.getId(), notificationType, referenceKey)) {
            return Map.of("status", "DEDUPLICATED");
        }

        NotificationLog entry = new NotificationLog();
        entry.setUserId(user.getId());
        entry.setNotificationType(notificationType);
        entry.setReferenceKey(referenceKey);
        entry.setRecipientEmail(user.getEmail());
        entry.setSubject(subject);
        String summary = htmlBody != null ? htmlBody.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim() : subject;
        if (summary.length() > 250) summary = summary.substring(0, 247) + "...";
        entry.setMessage(summary);

        if (!isSmtpConfigured()) {
            entry.setDeliveryStatus("SMTP_NOT_CONFIGURED");
            entry.setErrorMessage("SMTP host (MAIL_HOST) is not configured; email delivery skipped.");
            safeSaveLog(entry);
            log.info("Email [{}] to {} skipped: SMTP not configured.", notificationType, user.getEmail());
            return Map.of("status", "SMTP_NOT_CONFIGURED", "subject", subject);
        }

        try {
            JavaMailSender sender = mailSenderProvider.getIfAvailable();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);

            entry.setDeliveryStatus("SENT");
            safeSaveLog(entry);
            return Map.of("status", "SENT", "subject", subject);
        } catch (Exception ex) {
            entry.setDeliveryStatus("FAILED");
            entry.setErrorMessage(ex.getMessage());
            safeSaveLog(entry);
            log.warn("Failed to send email [{}] to {}: {}", notificationType, user.getEmail(), ex.getMessage());
            return Map.of("status", "FAILED", "error", String.valueOf(ex.getMessage()));
        }
    }

    private void safeSaveLog(NotificationLog entry) {
        try {
            notificationLogRepository.save(entry);
        } catch (Exception ex) {
            log.debug("Notification log duplicate or persistence skip: {}", ex.getMessage());
        }
    }

    private String wrapLayout(String title, String bodyHtml, String ctaLabel, String ctaHref) {
        return "<!DOCTYPE html><html><body style=\"margin:0;padding:24px;background:#ebe2cc;font-family:Arial,Helvetica,sans-serif;color:#2d2821;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#f5efe1;border:1px solid #cfc6b1;border-radius:14px;overflow:hidden;\">"
                + "<div style=\"background:#5a5447;color:#f7f3ec;padding:20px 24px;\">"
                + "<div style=\"font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.85;\">CarbonTrack</div>"
                + "<h1 style=\"margin:6px 0 0;font-size:20px;\">" + escapeHtml(title) + "</h1>"
                + "</div>"
                + "<div style=\"padding:24px;font-size:15px;line-height:1.6;\">" + bodyHtml
                + "<div style=\"margin-top:24px;\">"
                + "<a href=\"" + escapeHtml(ctaHref) + "\" style=\"display:inline-block;background:#6b7b4c;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold;\">"
                + escapeHtml(ctaLabel) + "</a>"
                + "</div></div>"
                + "<div style=\"background:#ded6c1;padding:14px 24px;font-size:12px;color:#5c5549;\">"
                + "CarbonTrack Sustainability Analytics Platform &bull; Manage notification preferences in Settings."
                + "</div></div></body></html>";
    }

    private String safeName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) return user.getDisplayName();
        if (user.getFirstName() != null && !user.getFirstName().isBlank()) return user.getFirstName();
        return "Eco Tracker";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
