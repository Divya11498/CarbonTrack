
package com.carbontrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "activity_types")
public class ActivityType {

    @Id
    private Short id;

    @Column(name = "category_id", nullable = false)
    private Short categoryId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "unit_type", nullable = false, length = 30)
    private String unitType;

    @Column(name = "description")
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public ActivityType() {
    }

    public Short getId() {
        return id;
    }

    public Short getCategoryId() {
        return categoryId;
    }

    public String getName() {
        return name;
    }

    public String getUnitType() {
        return unitType;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
