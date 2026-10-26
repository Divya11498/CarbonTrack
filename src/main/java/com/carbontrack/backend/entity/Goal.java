
package com.carbontrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "category_id")
    private Short categoryId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "goal_type", nullable = false)
    private String goalType;

    @Column(name = "target_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "target_unit", nullable = false)
    private String targetUnit;

    @Column(name = "period_type", nullable = false)
    private String periodType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public Goal() {
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getOrganizationId() { return organizationId; }
    public Short getCategoryId() { return categoryId; }
    public String getTitle() { return title; }
    public String getGoalType() { return goalType; }
    public BigDecimal getTargetValue() { return targetValue; }
    public String getTargetUnit() { return targetUnit; }
    public String getPeriodType() { return periodType; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getStatus() { return status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public void setCategoryId(Short categoryId) { this.categoryId = categoryId; }
    public void setTitle(String title) { this.title = title; }
    public void setGoalType(String goalType) { this.goalType = goalType; }
    public void setTargetValue(BigDecimal targetValue) { this.targetValue = targetValue; }
    public void setTargetUnit(String targetUnit) { this.targetUnit = targetUnit; }
    public void setPeriodType(String periodType) { this.periodType = periodType; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setStatus(String status) { this.status = status; }
}
