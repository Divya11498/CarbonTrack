
        package com.carbontrack.backend.entity;

import jakarta.persistence.*;

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

    public UserBadge() {
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
}
