
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
@Table(name = "goal_progress")
public class GoalProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goal_id", nullable = false)
    private Long goalId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "actual_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualValue;

    @Column(name = "target_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "percent_achieved", nullable = false, precision = 6, scale = 2)
    private BigDecimal percentAchieved;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public GoalProgress() {
    }

    public Long getId() { return id; }
    public Long getGoalId() { return goalId; }
    public LocalDate getPeriodStart() { return periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public BigDecimal getActualValue() { return actualValue; }
    public BigDecimal getTargetValue() { return targetValue; }
    public BigDecimal getPercentAchieved() { return percentAchieved; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setGoalId(Long goalId) { this.goalId = goalId; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
    public void setActualValue(BigDecimal actualValue) { this.actualValue = actualValue; }
    public void setTargetValue(BigDecimal targetValue) { this.targetValue = targetValue; }
    public void setPercentAchieved(BigDecimal percentAchieved) { this.percentAchieved = percentAchieved; }
}
