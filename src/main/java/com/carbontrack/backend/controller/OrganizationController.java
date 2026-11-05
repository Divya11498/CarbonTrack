package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Organization;
import com.carbontrack.backend.entity.OrganizationInvitation;
import com.carbontrack.backend.entity.OrganizationMember;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.OrganizationInvitationRepository;
import com.carbontrack.backend.repository.OrganizationMemberRepository;
import com.carbontrack.backend.repository.OrganizationRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationInvitationRepository organizationInvitationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public OrganizationController(
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            OrganizationInvitationRepository organizationInvitationRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.organizationInvitationRepository = organizationInvitationRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    // 1. Get current user's organization workspace
    @GetMapping("/my")
    public ResponseEntity<?> getMyOrganization(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(user.getId());
        Organization org = null;
        OrganizationMember userMember = null;

        if (memberships.isEmpty()) {
            // Check if any default organization exists
            List<Organization> allOrgs = organizationRepository.findAll();
            if (!allOrgs.isEmpty()) {
                org = allOrgs.get(0);
                userMember = new OrganizationMember(org.getId(), user.getId(), "MEMBER", "Engineering");
                organizationMemberRepository.save(userMember);
            } else {
                return ResponseEntity.ok(Map.of("hasOrganization", false));
            }
        } else {
            userMember = memberships.get(0);
            org = organizationRepository.findById(userMember.getOrganizationId()).orElse(null);
        }

        if (org == null) {
            return ResponseEntity.ok(Map.of("hasOrganization", false));
        }

        return ResponseEntity.ok(buildOrganizationResponse(org, userMember));
    }

    // 2. Create a new organization
    @PostMapping
    public ResponseEntity<?> createOrganization(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Organization name is required"));
        }

        Organization org = new Organization();
        org.setName(name.trim());
        org.setOrganizationType(payload.getOrDefault("organizationType", "COMPANY"));
        org.setDescription(payload.get("description"));
        org.setWebsite(payload.get("website"));
        org.setContactEmail(payload.get("contactEmail"));
        org.setLogoUrl(payload.get("logoUrl"));
        org.setIsActive(true);

        Organization savedOrg = organizationRepository.save(org);

        // Make creator the OWNER
        OrganizationMember owner = new OrganizationMember(
                savedOrg.getId(),
                user.getId(),
                "OWNER",
                payload.getOrDefault("department", "Management")
        );
        organizationMemberRepository.save(owner);

        return ResponseEntity.status(HttpStatus.CREATED).body(buildOrganizationResponse(savedOrg, owner));
    }

    // 3. Update organization details
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrganization(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Organization org = organizationRepository.findById(id).orElse(null);
        if (org == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Organization not found"));
        }

        OrganizationMember member = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (member == null || (!"OWNER".equalsIgnoreCase(member.getRole()) && !"ADMIN".equalsIgnoreCase(member.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only organization owners or administrators can edit organization details"));
        }

        if (payload.containsKey("name") && payload.get("name") != null && !payload.get("name").isBlank()) {
            org.setName(payload.get("name").trim());
        }
        if (payload.containsKey("organizationType") && payload.get("organizationType") != null) {
            org.setOrganizationType(payload.get("organizationType"));
        }
        if (payload.containsKey("description")) {
            org.setDescription(payload.get("description"));
        }
        if (payload.containsKey("website")) {
            org.setWebsite(payload.get("website"));
        }
        if (payload.containsKey("contactEmail")) {
            org.setContactEmail(payload.get("contactEmail"));
        }
        if (payload.containsKey("logoUrl")) {
            org.setLogoUrl(payload.get("logoUrl"));
        }

        Organization saved = organizationRepository.save(org);
        return ResponseEntity.ok(buildOrganizationResponse(saved, member));
    }

    // 4. Delete organization
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrganization(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Organization org = organizationRepository.findById(id).orElse(null);
        if (org == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Organization not found"));
        }

        OrganizationMember member = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (member == null || !"OWNER".equalsIgnoreCase(member.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the organization owner can delete the organization"));
        }

        organizationRepository.delete(org);
        return ResponseEntity.ok(Map.of("message", "Organization deleted successfully", "id", id));
    }

    // 5. Add / Invite a member to the organization
    @PostMapping("/{id}/members")
    public ResponseEntity<?> inviteOrAddMember(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Organization org = organizationRepository.findById(id).orElse(null);
        if (org == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Organization not found"));
        }

        OrganizationMember callerMember = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (callerMember == null || (!"OWNER".equalsIgnoreCase(callerMember.getRole()) && !"ADMIN".equalsIgnoreCase(callerMember.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only organization owners or administrators can invite members"));
        }

        String targetEmail = payload.get("email");
        if (targetEmail == null || targetEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Member email is required"));
        }
        targetEmail = targetEmail.trim().toLowerCase();

        String role = payload.getOrDefault("role", "MEMBER").toUpperCase();
        if (!"ADMIN".equals(role) && !"MEMBER".equals(role)) {
            role = "MEMBER";
        }
        String department = payload.getOrDefault("department", "Engineering");

        // Check if user already exists
        Optional<User> existingUserOpt = userRepository.findByEmail(targetEmail);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            Optional<OrganizationMember> existingMembership = organizationMemberRepository
                    .findByOrganizationIdAndUserId(id, existingUser.getId());

            if (existingMembership.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "This user is already a member of the organization"));
            }

            OrganizationMember newMember = new OrganizationMember(id, existingUser.getId(), role, department);
            organizationMemberRepository.save(newMember);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Member added to organization successfully",
                    "memberId", newMember.getId(),
                    "email", targetEmail,
                    "role", role,
                    "department", department
            ));
        }

        // Otherwise create an organization invitation
        String token = UUID.randomUUID().toString();
        OrganizationInvitation invitation = new OrganizationInvitation(
                id,
                targetEmail,
                role,
                department,
                token,
                user.getId(),
                OffsetDateTime.now().plusDays(7)
        );
        organizationInvitationRepository.save(invitation);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Invitation dispatched successfully",
                "invitationId", invitation.getId(),
                "email", targetEmail,
                "role", role,
                "department", department,
                "invitationToken", token
        ));
    }

    // 6. Remove member from organization
    @DeleteMapping("/{id}/members/{targetUserId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        OrganizationMember caller = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (caller == null || (!"OWNER".equalsIgnoreCase(caller.getRole()) && !"ADMIN".equalsIgnoreCase(caller.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only owners or administrators can remove members"));
        }

        OrganizationMember target = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, targetUserId)
                .orElse(null);

        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Member not found in organization"));
        }

        if ("OWNER".equalsIgnoreCase(target.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot remove the organization owner"));
        }

        organizationMemberRepository.delete(target);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully", "userId", targetUserId));
    }

    // 7. Update member role
    @PutMapping("/{id}/members/{targetUserId}/role")
    public ResponseEntity<?> updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        OrganizationMember caller = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (caller == null || (!"OWNER".equalsIgnoreCase(caller.getRole()) && !"ADMIN".equalsIgnoreCase(caller.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only owners or administrators can update roles"));
        }

        OrganizationMember target = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, targetUserId)
                .orElse(null);

        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Member not found in organization"));
        }

        String newRole = payload.get("role");
        if (newRole == null || (!newRole.equalsIgnoreCase("ADMIN") && !newRole.equalsIgnoreCase("MEMBER"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role. Must be ADMIN or MEMBER"));
        }

        if ("OWNER".equalsIgnoreCase(target.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot modify owner role"));
        }

        target.setRole(newRole.toUpperCase());
        organizationMemberRepository.save(target);

        return ResponseEntity.ok(Map.of("message", "Member role updated successfully", "userId", targetUserId, "role", newRole.toUpperCase()));
    }

    // 8. Revoke pending invitation
    @DeleteMapping("/{id}/invitations/{invitationId}")
    public ResponseEntity<?> revokeInvitation(
            @PathVariable Long id,
            @PathVariable Long invitationId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        OrganizationMember caller = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (caller == null || (!"OWNER".equalsIgnoreCase(caller.getRole()) && !"ADMIN".equalsIgnoreCase(caller.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only owners or administrators can manage invitations"));
        }

        OrganizationInvitation inv = organizationInvitationRepository.findById(invitationId).orElse(null);
        if (inv == null || !inv.getOrganizationId().equals(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invitation not found"));
        }

        organizationInvitationRepository.delete(inv);
        return ResponseEntity.ok(Map.of("message", "Invitation revoked successfully", "id", invitationId));
    }

    // Helper: Build comprehensive organization view response
    private Map<String, Object> buildOrganizationResponse(Organization org, OrganizationMember userMember) {
        List<OrganizationMember> members = organizationMemberRepository.findByOrganizationId(org.getId());
        Set<Long> memberUserIds = members.stream().map(OrganizationMember::getUserId).collect(Collectors.toSet());
        List<User> userList = userRepository.findAllById(memberUserIds);
        Map<Long, User> userMap = userList.stream().collect(Collectors.toMap(User::getId, u -> u));

        List<ActivityLog> allActivities = activityLogRepository.findAll();

        BigDecimal totalOrgEmissions = BigDecimal.ZERO;
        List<Map<String, Object>> memberDetails = new ArrayList<>();
        Set<Short> activeCategories = new HashSet<>();

        for (OrganizationMember m : members) {
            User memberUser = userMap.get(m.getUserId());
            List<ActivityLog> memberActs = allActivities.stream()
                    .filter(a -> m.getUserId().equals(a.getUserId()))
                    .collect(Collectors.toList());

            BigDecimal memberEmissions = BigDecimal.ZERO;
            for (ActivityLog a : memberActs) {
                if (a.getCo2eKg() != null) {
                    memberEmissions = memberEmissions.add(a.getCo2eKg());
                }
                if (a.getCategoryId() != null) {
                    activeCategories.add(a.getCategoryId());
                }
            }

            totalOrgEmissions = totalOrgEmissions.add(memberEmissions);

            Map<String, Object> map = new HashMap<>();
            map.put("memberId", m.getId());
            map.put("userId", m.getUserId());
            map.put("name", memberUser != null ? memberUser.getDisplayName() : "Member");
            map.put("email", memberUser != null ? memberUser.getEmail() : "");
            map.put("avatarUrl", memberUser != null ? memberUser.getAvatarUrl() : "");
            map.put("role", m.getRole());
            map.put("department", (m.getDepartment() != null) ? m.getDepartment() : "Engineering");
            map.put("activitiesCount", memberActs.size());
            map.put("emissions", memberEmissions.setScale(1, RoundingMode.HALF_UP));
            map.put("joinedAt", m.getJoinedAt());
            memberDetails.add(map);
        }

        // Sort members by emissions
        memberDetails.sort((a, b) -> ((BigDecimal) a.get("emissions")).compareTo((BigDecimal) b.get("emissions")));

        BigDecimal avgPerEmployee = members.isEmpty() ? BigDecimal.ZERO
                : totalOrgEmissions.divide(BigDecimal.valueOf(members.size()), 1, RoundingMode.HALF_UP);

        // Department breakdown
        Map<String, BigDecimal> deptSums = new HashMap<>();
        Map<String, Integer> deptCounts = new HashMap<>();
        for (Map<String, Object> m : memberDetails) {
            String dept = (String) m.get("department");
            BigDecimal em = (BigDecimal) m.get("emissions");
            deptSums.put(dept, deptSums.getOrDefault(dept, BigDecimal.ZERO).add(em));
            deptCounts.put(dept, deptCounts.getOrDefault(dept, 0) + 1);
        }

        List<Map<String, Object>> departmentStats = deptSums.entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", e.getKey());
                    map.put("emissions", e.getValue().setScale(1, RoundingMode.HALF_UP));
                    map.put("memberCount", deptCounts.getOrDefault(e.getKey(), 1));
                    return map;
                })
                .collect(Collectors.toList());

        // Pending invitations
        List<OrganizationInvitation> pendingInvs = organizationInvitationRepository
                .findByOrganizationIdAndStatus(org.getId(), "PENDING");

        List<Map<String, Object>> invitationDetails = pendingInvs.stream().map(inv -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", inv.getId());
            map.put("email", inv.getEmail());
            map.put("role", inv.getRole());
            map.put("department", inv.getDepartment());
            map.put("invitationToken", inv.getInvitationToken());
            map.put("createdAt", inv.getCreatedAt());
            map.put("expiresAt", inv.getExpiresAt());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("hasOrganization", true);
        response.put("organizationId", org.getId());
        response.put("name", org.getName());
        response.put("type", org.getOrganizationType());
        response.put("description", org.getDescription());
        response.put("website", org.getWebsite());
        response.put("contactEmail", org.getContactEmail());
        response.put("logoUrl", org.getLogoUrl());
        response.put("userRole", userMember != null ? userMember.getRole() : "MEMBER");
        response.put("totalMembers", members.size());
        response.put("activeProjects", Math.max(activeCategories.size(), 3));
        response.put("pendingInvitationsCount", pendingInvs.size());
        response.put("totalEmissionsKg", totalOrgEmissions.setScale(1, RoundingMode.HALF_UP));
        response.put("averagePerMemberKg", avgPerEmployee);
        response.put("organizationMonthlyTarget", new BigDecimal("1200.00"));
        response.put("members", memberDetails);
        response.put("departments", departmentStats);
        response.put("invitations", invitationDetails);

        return response;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName())
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .orElse(null);
    }
}
