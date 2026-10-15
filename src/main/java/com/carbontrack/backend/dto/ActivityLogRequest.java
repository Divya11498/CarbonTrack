
package com.carbontrack.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ActivityLogRequest {

    @NotNull
    @Positive
    private Long userId;

    @NotNull
    @Positive
    private Short categoryId;

    @NotNull
    @Positive
    private Short activityTypeId;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal quantity;

    @NotBlank
    private String unit;

    @NotNull
    private LocalDate logDate;

    private Long organizationId;
    private String notes;

    public Long getUserId() { return userId; }
    public Short getCategoryId() { return categoryId; }
    public Short getActivityTypeId() { return activityTypeId; }
    public BigDecimal getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public LocalDate getLogDate() { return logDate; }
    public Long getOrganizationId() { return organizationId; }
    public String getNotes() { return notes; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setCategoryId(Short categoryId) { this.categoryId = categoryId; }
    public void setActivityTypeId(Short activityTypeId) { this.activityTypeId = activityTypeId; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public void setNotes(String notes) { this.notes = notes; }
}
