package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityCategory;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.Organization;
import com.carbontrack.backend.entity.OrganizationInvitation;
import com.carbontrack.backend.entity.OrganizationMember;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityCategoryRepository;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.OrganizationInvitationRepository;
import com.carbontrack.backend.repository.OrganizationMemberRepository;
import com.carbontrack.backend.repository.OrganizationRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.CacheEvictionService;
import com.carbontrack.backend.service.EmailService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
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
    private final GoalRepository goalRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final CacheEvictionService cacheEvictionService;
    private final EmailService emailService;

    public OrganizationController(
            OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            OrganizationInvitationRepository organizationInvitationRepository,
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            GoalRepository goalRepository,
            ActivityCategoryRepository categoryRepository,
            CacheEvictionService cacheEvictionService,
            EmailService emailService) {
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.organizationInvitationRepository = organizationInvitationRepository;
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.categoryRepository = categoryRepository;
        this.cacheEvictionService = cacheEvictionService;
        this.emailService = emailService;
    }

    // 1. Get current user's organization workspace (supports switching via optional orgId)
    @GetMapping("/my")
    public ResponseEntity<?> getMyOrganization(
            @RequestParam(required = false) Long orgId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasOrganization", false));
        }

        Organization org = null;
        OrganizationMember userMember = null;

        if (orgId != null) {
            for (OrganizationMember m : memberships) {
                if (m.getOrganizationId().equals(orgId)) {
                    userMember = m;
                    org = organizationRepository.findById(m.getOrganizationId()).orElse(null);
                    break;
                }
            }
        }

        if (org == null) {
            userMember = memberships.get(0);
            org = organizationRepository.findById(userMember.getOrganizationId()).orElse(null);
        }

        if (org == null) {
            return ResponseEntity.ok(Map.of("hasOrganization", false));
        }

        return ResponseEntity.ok(buildOrganizationResponse(org, userMember));
    }

    // 1b. Get all organizations the current user belongs to (Workspace switcher)
    @GetMapping("/list")
    public ResponseEntity<?> getMyOrganizationsList(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(user.getId());
        List<Map<String, Object>> orgs = new ArrayList<>();
        for (OrganizationMember m : memberships) {
            Organization org = organizationRepository.findById(m.getOrganizationId()).orElse(null);
            if (org != null) {
                long count = organizationMemberRepository.findByOrganizationId(org.getId()).size();
                Map<String, Object> item = new HashMap<>();
                item.put("organizationId", org.getId());
                item.put("name", org.getName());
                item.put("organizationType", org.getOrganizationType());
                item.put("role", m.getRole());
                item.put("department", m.getDepartment());
                item.put("membersCount", count);
                orgs.add(item);
            }
        }
        return ResponseEntity.ok(orgs);
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

        try {
            emailService.sendOrganizationInvitation(targetEmail, org, user, token, role, department);
        } catch (Exception e) {
            // Log but don't fail invitation creation
        }

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

    // 7b. Update member department
    @PutMapping("/{id}/members/{targetUserId}/department")
    public ResponseEntity<?> updateMemberDepartment(
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
                    .body(Map.of("error", "Only organization owners or administrators can assign departments"));
        }

        OrganizationMember target = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, targetUserId)
                .orElse(null);

        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Member not found in organization"));
        }

        String department = payload.get("department");
        if (department == null || department.trim().isEmpty()) {
            department = "General";
        }

        target.setDepartment(department.trim());
        organizationMemberRepository.save(target);

        return ResponseEntity.ok(Map.of(
                "message", "Member department updated successfully",
                "userId", targetUserId,
                "department", target.getDepartment()
        ));
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

    // 9. Resend pending invitation
    @PostMapping("/{id}/invitations/{invitationId}/resend")
    public ResponseEntity<?> resendInvitation(
            @PathVariable Long id,
            @PathVariable Long invitationId,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Organization org = organizationRepository.findById(id).orElse(null);
        if (org == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Organization not found"));
        }

        OrganizationMember caller = organizationMemberRepository
                .findByOrganizationIdAndUserId(id, user.getId())
                .orElse(null);

        if (caller == null || (!"OWNER".equalsIgnoreCase(caller.getRole()) && !"ADMIN".equalsIgnoreCase(caller.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only owners or administrators can resend invitations"));
        }

        OrganizationInvitation inv = organizationInvitationRepository.findById(invitationId).orElse(null);
        if (inv == null || !inv.getOrganizationId().equals(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invitation not found"));
        }

        inv.setExpiresAt(OffsetDateTime.now().plusDays(7));
        organizationInvitationRepository.save(inv);

        try {
            emailService.sendOrganizationInvitation(inv.getEmail(), org, user, inv.getInvitationToken(), inv.getRole(), inv.getDepartment());
        } catch (Exception e) {
            // Non-blocking email dispatch
        }

        return ResponseEntity.ok(Map.of(
                "message", "Invitation resent successfully",
                "invitationId", inv.getId(),
                "email", inv.getEmail(),
                "expiresAt", inv.getExpiresAt()
        ));
    }

    // 10. Get public invitation metadata
    @GetMapping("/invitations/info/{token}")
    public ResponseEntity<?> getInvitationInfo(@PathVariable String token) {
        OrganizationInvitation inv = organizationInvitationRepository.findByInvitationToken(token).orElse(null);
        if (inv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invalid or expired invitation token"));
        }
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation token has expired"));
        }
        if (!"PENDING".equalsIgnoreCase(inv.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation has already been accepted or revoked"));
        }

        Organization org = organizationRepository.findById(inv.getOrganizationId()).orElse(null);
        User inviter = inv.getInvitedByUserId() != null ? userRepository.findById(inv.getInvitedByUserId()).orElse(null) : null;

        Map<String, Object> info = new HashMap<>();
        info.put("organizationName", org != null ? org.getName() : "CarbonTrack Organization");
        info.put("organizationType", org != null ? org.getOrganizationType() : "COMPANY");
        info.put("organizationLogo", org != null ? org.getLogoUrl() : null);
        info.put("role", inv.getRole());
        info.put("department", inv.getDepartment());
        info.put("invitedEmail", inv.getEmail());
        info.put("inviterName", inviter != null ? inviter.getDisplayName() : "A team administrator");
        info.put("expiresAt", inv.getExpiresAt());

        return ResponseEntity.ok(info);
    }

    // 11. Accept invitation
    @PostMapping("/invitations/accept/{token}")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable String token,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        OrganizationInvitation inv = organizationInvitationRepository.findByInvitationToken(token).orElse(null);
        if (inv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invalid invitation token"));
        }
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation token has expired"));
        }
        if (!"PENDING".equalsIgnoreCase(inv.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation has already been processed"));
        }

        Organization org = organizationRepository.findById(inv.getOrganizationId()).orElse(null);
        if (org == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Organization not found"));
        }

        Optional<OrganizationMember> existing = organizationMemberRepository
                .findByOrganizationIdAndUserId(inv.getOrganizationId(), user.getId());

        if (existing.isPresent()) {
            inv.setStatus("ACCEPTED");
            organizationInvitationRepository.save(inv);
            return ResponseEntity.ok(Map.of(
                    "message", "You are already a member of " + org.getName(),
                    "organizationId", org.getId()
            ));
        }

        OrganizationMember newMember = new OrganizationMember(
                inv.getOrganizationId(),
                user.getId(),
                inv.getRole() != null ? inv.getRole() : "MEMBER",
                inv.getDepartment() != null ? inv.getDepartment() : "General"
        );
        organizationMemberRepository.save(newMember);

        inv.setStatus("ACCEPTED");
        organizationInvitationRepository.save(inv);

        return ResponseEntity.ok(Map.of(
                "message", "Welcome to " + org.getName() + "! You have joined as a " + newMember.getRole() + ".",
                "organizationId", org.getId()
        ));
    }

    // Helper: Build comprehensive organization view response
    private Map<String, Object> buildOrganizationResponse(Organization org, OrganizationMember userMember) {
        List<OrganizationMember> members = organizationMemberRepository.findByOrganizationId(org.getId());
        Set<Long> memberUserIds = members.stream().map(OrganizationMember::getUserId).collect(Collectors.toSet());
        List<User> userList = userRepository.findAllById(memberUserIds);
        Map<Long, User> userMap = userList.stream().collect(Collectors.toMap(User::getId, u -> u));

        List<ActivityLog> orgScopedActivities = activityLogRepository.findAll().stream()
                .filter(a -> memberUserIds.contains(a.getUserId()))
                .filter(a -> a.getOrganizationId() == null || org.getId().equals(a.getOrganizationId()))
                .toList();

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(29);
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal totalOrgEmissions = BigDecimal.ZERO;
        BigDecimal totalMonthEmissions = BigDecimal.ZERO;
        List<Map<String, Object>> memberDetails = new ArrayList<>();
        Set<Short> activeCategories = new HashSet<>();
        Set<Long> activeUsersCountSet = new HashSet<>();
        Map<Short, BigDecimal> categorySums = new HashMap<>();

        for (OrganizationMember m : members) {
            User memberUser = userMap.get(m.getUserId());
            List<ActivityLog> memberActs = orgScopedActivities.stream()
                    .filter(a -> m.getUserId().equals(a.getUserId()))
                    .collect(Collectors.toList());

            BigDecimal memberEmissions = BigDecimal.ZERO;
            for (ActivityLog a : memberActs) {
                BigDecimal c = a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO;
                memberEmissions = memberEmissions.add(c);
                if (a.getLogDate() != null && !a.getLogDate().isBefore(monthStart)) {
                    totalMonthEmissions = totalMonthEmissions.add(c);
                }
                if (a.getLogDate() != null && !a.getLogDate().isBefore(thirtyDaysAgo)) {
                    activeUsersCountSet.add(m.getUserId());
                }
                if (a.getCategoryId() != null) {
                    activeCategories.add(a.getCategoryId());
                    categorySums.merge(a.getCategoryId(), c, BigDecimal::add);
                }
            }

            totalOrgEmissions = totalOrgEmissions.add(memberEmissions);

            String avatarUrl = memberUser != null ? memberUser.getAvatarUrl() : null;
            if (avatarUrl == null || avatarUrl.isBlank()) {
                String seed = (memberUser != null && memberUser.getAvatarSeed() != null)
                        ? memberUser.getAvatarSeed()
                        : "ct-member-" + m.getUserId();
                avatarUrl = "https://blobatar.dev/avatar/" + seed + "?gen=2";
            }

            Map<String, Object> map = new HashMap<>();
            map.put("memberId", m.getId());
            map.put("userId", m.getUserId());
            map.put("name", memberUser != null && memberUser.getDisplayName() != null ? memberUser.getDisplayName() : "Member");
            map.put("email", memberUser != null ? memberUser.getEmail() : "");
            map.put("avatarUrl", avatarUrl);
            map.put("avatarSeed", (memberUser != null && memberUser.getAvatarSeed() != null) ? memberUser.getAvatarSeed() : "ct-member-" + m.getUserId());
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

        // Department breakdown with average metrics and member rosters
        Map<String, BigDecimal> deptSums = new HashMap<>();
        Map<String, Integer> deptCounts = new HashMap<>();
        Map<String, List<String>> deptMembers = new HashMap<>();
        for (Map<String, Object> m : memberDetails) {
            String dept = (String) m.get("department");
            if (dept == null || dept.isBlank()) dept = "Engineering";
            BigDecimal em = (BigDecimal) m.get("emissions");
            deptSums.put(dept, deptSums.getOrDefault(dept, BigDecimal.ZERO).add(em));
            deptCounts.put(dept, deptCounts.getOrDefault(dept, 0) + 1);
            deptMembers.computeIfAbsent(dept, k -> new ArrayList<>()).add((String) m.get("name"));
        }

        List<Map<String, Object>> departmentStats = deptSums.entrySet().stream()
                .map(e -> {
                    String deptName = e.getKey();
                    BigDecimal totalEm = e.getValue().setScale(1, RoundingMode.HALF_UP);
                    int count = deptCounts.getOrDefault(deptName, 1);
                    BigDecimal avgEm = count > 0 ? totalEm.divide(BigDecimal.valueOf(count), 1, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", deptName);
                    map.put("emissions", totalEm);
                    map.put("memberCount", count);
                    map.put("averagePerMemberKg", avgEm);
                    map.put("members", deptMembers.getOrDefault(deptName, List.of()));
                    return map;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("emissions")).compareTo((BigDecimal) a.get("emissions")))
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

        Map<Short, ActivityCategory> catMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(ActivityCategory::getId, c -> c));
        List<Map<String, Object>> categoryBreakdown = categorySums.entrySet().stream()
                .map(e -> {
                    ActivityCategory c = catMap.get(e.getKey());
                    String cname = c != null ? c.getName() : "other";
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", Character.toUpperCase(cname.charAt(0)) + cname.substring(1).toLowerCase());
                    m.put("value", e.getValue().setScale(1, RoundingMode.HALF_UP));
                    return m;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("value")).compareTo((BigDecimal) a.get("value")))
                .toList();

        // Monthly 6-month organization trend
        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDate mCursor = monthStart.minusMonths(5);
        for (int i = 0; i < 6; i++) {
            LocalDate ms = mCursor.plusMonths(i);
            LocalDate me = ms.plusMonths(1).minusDays(1);
            BigDecimal mSum = orgScopedActivities.stream()
                    .filter(a -> a.getLogDate() != null && !a.getLogDate().isBefore(ms) && !a.getLogDate().isAfter(me))
                    .map(a -> a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> pt = new HashMap<>();
            pt.put("month", ms.format(monthFmt));
            pt.put("co2e", mSum.setScale(1, RoundingMode.HALF_UP));
            monthlyTrends.add(pt);
        }

        // Organization goals achieved count across members
        List<Goal> orgGoals = goalRepository.findAll().stream()
                .filter(g -> memberUserIds.contains(g.getUserId()))
                .filter(g -> g.getOrganizationId() == null || org.getId().equals(g.getOrganizationId()))
                .toList();
        long goalsAchievedCount = orgGoals.stream()
                .filter(g -> "ACHIEVED".equalsIgnoreCase(g.getStatus()) || "COMPLETED".equalsIgnoreCase(g.getStatus()))
                .count();

        double monthlyTargetVal = Math.max(300.0, members.size() * 150.0);
        BigDecimal orgMonthlyTarget = BigDecimal.valueOf(monthlyTargetVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalCo2eSaved = orgMonthlyTarget.subtract(totalMonthEmissions);
        if (totalCo2eSaved.compareTo(BigDecimal.ZERO) < 0) {
            totalCo2eSaved = BigDecimal.ZERO;
        }
        int dayOfMonth = Math.max(1, today.getDayOfMonth());
        BigDecimal avgDailyCo2 = totalMonthEmissions.divide(BigDecimal.valueOf(dayOfMonth), 2, RoundingMode.HALF_UP);

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
        response.put("activeUsersCount", activeUsersCountSet.size());
        response.put("activeProjects", activeCategories.size());
        response.put("pendingInvitationsCount", pendingInvs.size());
        response.put("totalEmissionsKg", totalOrgEmissions.setScale(1, RoundingMode.HALF_UP));
        response.put("monthlyEmissionsKg", totalMonthEmissions.setScale(1, RoundingMode.HALF_UP));
        response.put("averagePerMemberKg", avgPerEmployee);
        response.put("averageDailyCo2eKg", avgDailyCo2);
        response.put("totalCo2eSavedKg", totalCo2eSaved.setScale(1, RoundingMode.HALF_UP));
        response.put("goalsAchievedCount", goalsAchievedCount);
        response.put("organizationMonthlyTarget", orgMonthlyTarget);
        response.put("categoryBreakdown", categoryBreakdown);
        response.put("monthlyTrends", monthlyTrends);
        response.put("members", memberDetails);
        response.put("departments", departmentStats);
        response.put("invitations", invitationDetails);

        // All workspace organizations the user belongs to (for workspace switching)
        List<Map<String, Object>> workspaces = new ArrayList<>();
        if (userMember != null) {
            List<OrganizationMember> allMemberships = organizationMemberRepository.findByUserId(userMember.getUserId());
            for (OrganizationMember om : allMemberships) {
                Organization o = organizationRepository.findById(om.getOrganizationId()).orElse(null);
                if (o != null) {
                    Map<String, Object> w = new HashMap<>();
                    w.put("organizationId", o.getId());
                    w.put("name", o.getName());
                    w.put("type", o.getOrganizationType());
                    w.put("role", om.getRole());
                    w.put("department", om.getDepartment());
                    w.put("isCurrent", o.getId().equals(org.getId()));
                    workspaces.add(w);
                }
            }
        }
        response.put("workspaces", workspaces);

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
