package com.carbontrack.backend.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "google_id", length = 255)
    private String googleId;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "display_name", length = 150)
    private String displayName;

    @Column(nullable = false, length = 20)
    private String role = "USER";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false, length = 64)
    private String timezone = "UTC";

    @Column(name = "preferred_unit", nullable = false, length = 20)
    private String preferredUnit = "kgCO2e";

    @Column(length = 100)
    private String department;

    @Column(name = "email_notifications", nullable = false)
    private Boolean emailNotifications = true;

    @Column(name = "weekly_report_enabled", nullable = false)
    private Boolean weeklyReportEnabled = true;

    @Column(name = "goal_alerts_enabled", nullable = false)
    private Boolean goalAlertsEnabled = true;

    @Column(name = "leaderboard_anonymized", nullable = false)
    private Boolean leaderboardAnonymized = false;

    @Column(name = "avatar_seed", length = 150)
    private String avatarSeed;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public User() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getPreferredUnit() {
        return preferredUnit;
    }

    public void setPreferredUnit(String preferredUnit) {
        this.preferredUnit = preferredUnit;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Boolean getEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(Boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public Boolean getWeeklyReportEnabled() {
        return weeklyReportEnabled;
    }

    public void setWeeklyReportEnabled(Boolean weeklyReportEnabled) {
        this.weeklyReportEnabled = weeklyReportEnabled;
    }

    public Boolean getGoalAlertsEnabled() {
        return goalAlertsEnabled;
    }

    public void setGoalAlertsEnabled(Boolean goalAlertsEnabled) {
        this.goalAlertsEnabled = goalAlertsEnabled;
    }

    public Boolean getLeaderboardAnonymized() {
        return leaderboardAnonymized;
    }

    public void setLeaderboardAnonymized(Boolean leaderboardAnonymized) {
        this.leaderboardAnonymized = leaderboardAnonymized;
    }

    public String getAvatarSeed() {
        return avatarSeed;
    }

    public void setAvatarSeed(String avatarSeed) {
        this.avatarSeed = avatarSeed;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
