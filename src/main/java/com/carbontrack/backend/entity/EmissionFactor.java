
package com.carbontrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "emission_factors")
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_type_id", nullable = false)
    private Short activityTypeId;

    @Column(name = "source_name", nullable = false, length = 100)
    private String sourceName;

    @Column(name = "source_version", length = 50)
    private String sourceVersion;

    @Column(name = "factor_value", nullable = false, precision = 12, scale = 6)
    private BigDecimal factorValue;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "scope", nullable = false, length = 30)
    private String scope = "DIRECT";

    @Column(name = "valid_from", nullable = false)
    private OffsetDateTime validFrom;

    @Column(name = "valid_to")
    private OffsetDateTime validTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(
            name = "created_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private OffsetDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "notes")
    private String notes;

    public EmissionFactor() {
    }

    public Long getId() {
        return id;
    }

    public Short getActivityTypeId() {
        return activityTypeId;
    }

    public String getSourceName() {
        return sourceName;
    }

    public String getSourceVersion() {
        return sourceVersion;
    }

    public BigDecimal getFactorValue() {
        return factorValue;
    }

    public String getUnit() {
        return unit;
    }

    public String getRegion() {
        return region;
    }

    public String getScope() {
        return scope;
    }

    public OffsetDateTime getValidFrom() {
        return validFrom;
    }

    public OffsetDateTime getValidTo() {
        return validTo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setActivityTypeId(Short activityTypeId) {
        this.activityTypeId = activityTypeId;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public void setSourceVersion(String sourceVersion) {
        this.sourceVersion = sourceVersion;
    }

    public void setFactorValue(BigDecimal factorValue) {
        this.factorValue = factorValue;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public void setValidFrom(OffsetDateTime validFrom) {
        this.validFrom = validFrom;
    }

    public void setValidTo(OffsetDateTime validTo) {
        this.validTo = validTo;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
