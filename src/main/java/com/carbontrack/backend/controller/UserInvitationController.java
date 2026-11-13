package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserInvitation;
import com.carbontrack.backend.repository.UserInvitationRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/invitations/personal")
public class UserInvitationController {

    private final UserInvitationRepository userInvitationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public UserInvitationController(
            UserInvitationRepository userInvitationRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.userInvitationRepository = userInvitationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // 1. Create and dispatch a personal friend/family invitation
    @PostMapping
    public ResponseEntity<?> createPersonalInvitation(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = payload.get("email");
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("error", "A valid email address is required"));
        }
        email = email.trim().toLowerCase();

        if (email.equalsIgnoreCase(user.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot invite your own email address"));
        }

        String message = payload.get("message");
        String token = UUID.randomUUID().toString();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusDays(14);

        UserInvitation invitation = new UserInvitation(user.getId(), email, token, message, expiresAt);
        userInvitationRepository.save(invitation);

        try {
            emailService.sendPersonalInvitation(email, user, token, message);
        } catch (Exception ex) {
            // Non-blocking email dispatch fallback
        }

        String shareUrl = frontendUrl + "?ref=" + token;

        Map<String, Object> resp = new HashMap<>();
        resp.put("invitationId", invitation.getId());
        resp.put("email", email);
        resp.put("invitationToken", token);
        resp.put("shareUrl", shareUrl);
        resp.put("status", "PENDING");
        resp.put("expiresAt", expiresAt);
        resp.put("message", "Personal invitation created and dispatched successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    // 2. Get public metadata for a personal invite token (permitAll)
    @GetMapping("/info/{token}")
    public ResponseEntity<?> getPersonalInvitationInfo(@PathVariable String token) {
        Optional<UserInvitation> opt = userInvitationRepository.findByInvitationToken(token);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invalid invitation token"));
        }

        UserInvitation inv = opt.get();
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation token has expired"));
        }
        if (!"PENDING".equalsIgnoreCase(inv.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation has already been " + inv.getStatus().toLowerCase()));
        }

        User inviter = userRepository.findById(inv.getInviterUserId()).orElse(null);
        String inviterName = inviter != null && inviter.getDisplayName() != null ? inviter.getDisplayName() : "A friend";
        String inviterAvatar = inviter != null ? inviter.getAvatarUrl() : null;

        Map<String, Object> info = new HashMap<>();
        info.put("valid", true);
        info.put("email", inv.getEmail());
        info.put("inviterName", inviterName);
        info.put("inviterAvatar", inviterAvatar);
        info.put("message", inv.getMessage());
        info.put("expiresAt", inv.getExpiresAt());

        return ResponseEntity.ok(info);
    }

    // 3. Accept a personal invitation
    @PostMapping("/accept/{token}")
    public ResponseEntity<?> acceptPersonalInvitation(
            @PathVariable String token,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<UserInvitation> opt = userInvitationRepository.findByInvitationToken(token);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invalid invitation token"));
        }

        UserInvitation inv = opt.get();
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This invitation token has expired"));
        }

        if ("ACCEPTED".equalsIgnoreCase(inv.getStatus())) {
            return ResponseEntity.ok(Map.of("message", "This invitation was already accepted"));
        }

        inv.setStatus("ACCEPTED");
        inv.setAcceptedByUserId(user.getId());
        inv.setAcceptedAt(OffsetDateTime.now());
        userInvitationRepository.save(inv);

        return ResponseEntity.ok(Map.of(
                "message", "Welcome to CarbonTrack! Your referral has been recorded.",
                "inviterId", inv.getInviterUserId()
        ));
    }

    // 4. List current user's sent personal invitations
    @GetMapping("/my")
    public ResponseEntity<?> getMySentInvitations(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<UserInvitation> list = userInvitationRepository.findByInviterUserIdOrderByCreatedAtDesc(user.getId());
        List<Map<String, Object>> response = list.stream().map(inv -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", inv.getId());
            m.put("email", inv.getEmail());
            m.put("status", inv.getStatus());
            m.put("message", inv.getMessage());
            m.put("invitationToken", inv.getInvitationToken());
            m.put("shareUrl", frontendUrl + "?ref=" + inv.getInvitationToken());
            m.put("createdAt", inv.getCreatedAt());
            m.put("expiresAt", inv.getExpiresAt());
            m.put("acceptedAt", inv.getAcceptedAt());
            return m;
        }).toList();

        return ResponseEntity.ok(response);
    }

    // 5. Revoke or delete a personal invitation
    @DeleteMapping("/{id}")
    public ResponseEntity<?> revokePersonalInvitation(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<UserInvitation> opt = userInvitationRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invitation not found"));
        }

        UserInvitation inv = opt.get();
        if (!inv.getInviterUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only revoke your own invitations"));
        }

        userInvitationRepository.delete(inv);
        return ResponseEntity.ok(Map.of("message", "Invitation deleted successfully", "id", id));
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
