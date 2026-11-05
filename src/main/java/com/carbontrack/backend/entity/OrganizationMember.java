package com.carbontrack.backend.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "organization_members")
public class OrganizationMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 25)
    private String role = "MEMBER";

    @Column(length = 100)
    private String department = "Engineering";

    @Column(name = "joined_at", nullable = false)
    private OffsetDateTime joinedAt = OffsetDateTime.now();

    public OrganizationMember() {
    }

    public OrganizationMember(Long organizationId, Long userId, String role) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.role = role;
        this.department = "Engineering";
        this.joinedAt = OffsetDateTime.now();
    }

    public OrganizationMember(Long organizationId, Long userId, String role, String department) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.role = role;
        this.department = (department != null && !department.isBlank()) ? department : "Engineering";
        this.joinedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public OffsetDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(OffsetDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
