package com.carbontrack.backend.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "organization_invitations")
public class OrganizationInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 25)
    private String role = "MEMBER";

    @Column(length = 100)
    private String department = "Engineering";

    @Column(name = "invitation_token", nullable = false, unique = true, length = 100)
    private String invitationToken;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "invited_by_user_id")
    private Long invitedByUserId;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public OrganizationInvitation() {
    }

    public OrganizationInvitation(Long organizationId, String email, String role, String department, String invitationToken, Long invitedByUserId, OffsetDateTime expiresAt) {
        this.organizationId = organizationId;
        this.email = email;
        this.role = (role != null) ? role : "MEMBER";
        this.department = (department != null && !department.isBlank()) ? department : "Engineering";
        this.invitationToken = invitationToken;
        this.status = "PENDING";
        this.invitedByUserId = invitedByUserId;
        this.expiresAt = expiresAt;
        this.createdAt = OffsetDateTime.now();
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public String getInvitationToken() {
        return invitationToken;
    }

    public void setInvitationToken(String invitationToken) {
        this.invitationToken = invitationToken;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getInvitedByUserId() {
        return invitedByUserId;
    }

    public void setInvitedByUserId(Long invitedByUserId) {
        this.invitedByUserId = invitedByUserId;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
