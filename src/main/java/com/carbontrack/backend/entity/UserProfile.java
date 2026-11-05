package com.carbontrack.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(length = 100)
    private String country;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String region;

    @Column(name = "household_size")
    private Short householdSize;

    @Column(name = "electricity_source", length = 50)
    private String electricitySource = "GRID";

    @Column(name = "lifestyle_type", length = 50)
    private String lifestyleType = "STANDARD";

    @Column(name = "monthly_target_kgco2e", precision = 10, scale = 2)
    private BigDecimal monthlyTargetKgco2e = new BigDecimal("200.00");

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public UserProfile() {
    }

    public UserProfile(Long userId) {
        this.userId = userId;
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

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Short getHouseholdSize() {
        return householdSize;
    }

    public void setHouseholdSize(Short householdSize) {
        this.householdSize = householdSize;
    }

    public String getElectricitySource() {
        return electricitySource;
    }

    public void setElectricitySource(String electricitySource) {
        this.electricitySource = electricitySource;
    }

    public String getLifestyleType() {
        return lifestyleType;
    }

    public void setLifestyleType(String lifestyleType) {
        this.lifestyleType = lifestyleType;
    }

    public BigDecimal getMonthlyTargetKgco2e() {
        return monthlyTargetKgco2e;
    }

    public void setMonthlyTargetKgco2e(BigDecimal monthlyTargetKgco2e) {
        this.monthlyTargetKgco2e = monthlyTargetKgco2e;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
