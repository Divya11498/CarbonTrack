package com.carbontrack.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category_id")
    private Short categoryId;

    @Column(name = "activity_type_id")
    private Short activityTypeId;

    @Column(name = "recommendation_type", nullable = false, length = 50)
    private String recommendationType = "OPTIMIZE";

    @Column(name = "category_name", length = 50)
    private String categoryName = "Carbon Reduction";

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "problem_identified", columnDefinition = "TEXT")
    private String problemIdentified;

    @Column(name = "estimated_co2e_savings_kg", precision = 12, scale = 2)
    private BigDecimal estimatedCo2eSavingsKg = BigDecimal.ZERO;

    @Column(name = "actual_co2e_savings_kg", precision = 12, scale = 2)
    private BigDecimal actualCo2eSavingsKg = BigDecimal.ZERO;

    @Column(name = "difficulty_level", length = 20)
    private String difficultyLevel = "MEDIUM";

    @Column(name = "priority_level", length = 20)
    private String priorityLevel = "MEDIUM";

    @Column(nullable = false)
    private Short priority = 1;

    @Column(length = 50)
    private String timeframe = "1-2 weeks";

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, IN_PROGRESS, COMPLETED, DISMISSED

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "generated_at", nullable = false)
    private OffsetDateTime generatedAt = OffsetDateTime.now();

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_ai_generated", nullable = false)
    private Boolean isAiGenerated = true;

    @Column(name = "ai_model", length = 100)
    private String aiModel = "CarbonTrack Analytics Engine";

    public Recommendation() {
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

    public Short getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Short categoryId) {
        this.categoryId = categoryId;
    }

    public Short getActivityTypeId() {
        return activityTypeId;
    }

    public void setActivityTypeId(Short activityTypeId) {
        this.activityTypeId = activityTypeId;
    }

    public String getRecommendationType() {
        return recommendationType;
    }

    public void setRecommendationType(String recommendationType) {
        this.recommendationType = recommendationType;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProblemIdentified() {
        return problemIdentified;
    }

    public void setProblemIdentified(String problemIdentified) {
        this.problemIdentified = problemIdentified;
    }

    public BigDecimal getEstimatedCo2eSavingsKg() {
        return estimatedCo2eSavingsKg;
    }

    public void setEstimatedCo2eSavingsKg(BigDecimal estimatedCo2eSavingsKg) {
        this.estimatedCo2eSavingsKg = estimatedCo2eSavingsKg;
    }

    public BigDecimal getActualCo2eSavingsKg() {
        return actualCo2eSavingsKg;
    }

    public void setActualCo2eSavingsKg(BigDecimal actualCo2eSavingsKg) {
        this.actualCo2eSavingsKg = actualCo2eSavingsKg;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(String difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public String getPriorityLevel() {
        return priorityLevel;
    }

    public void setPriorityLevel(String priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public Short getPriority() {
        return priority;
    }

    public void setPriority(Short priority) {
        this.priority = priority;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public void setTimeframe(String timeframe) {
        this.timeframe = timeframe;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(OffsetDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public OffsetDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(OffsetDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsAiGenerated() {
        return isAiGenerated;
    }

    public void setIsAiGenerated(Boolean isAiGenerated) {
        this.isAiGenerated = isAiGenerated;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }
}
