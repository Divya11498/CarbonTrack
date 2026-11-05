package com.carbontrack.backend.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_badges")
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "badge_id", nullable = false)
    private Short badgeId;

    @Column(name = "earned_at", nullable = false)
    private OffsetDateTime earnedAt = OffsetDateTime.now();

    @Column(name = "source_event", length = 120)
    private String sourceEvent;

    public UserBadge() {
    }

    public UserBadge(Long userId, Short badgeId, String sourceEvent) {
        this.userId = userId;
        this.badgeId = badgeId;
        this.sourceEvent = sourceEvent;
        this.earnedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Short getBadgeId() {
        return badgeId;
    }

    public void setBadgeId(Short badgeId) {
        this.badgeId = badgeId;
    }

    public OffsetDateTime getEarnedAt() {
        return earnedAt;
    }

    public void setEarnedAt(OffsetDateTime earnedAt) {
        this.earnedAt = earnedAt;
    }

    public String getSourceEvent() {
        return sourceEvent;
    }

    public void setSourceEvent(String sourceEvent) {
        this.sourceEvent = sourceEvent;
    }
}
