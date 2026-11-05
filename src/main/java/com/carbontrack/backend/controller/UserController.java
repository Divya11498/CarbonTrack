package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserProfile;
import com.carbontrack.backend.repository.UserProfileRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Get current user profile and preferences
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile(user.getId());
                    return userProfileRepository.save(newProfile);
                });

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("displayName", user.getDisplayName());
        data.put("avatarUrl", user.getAvatarUrl());
        data.put("role", user.getRole());
        data.put("timezone", user.getTimezone());
        data.put("preferredUnit", user.getPreferredUnit());
        data.put("createdAt", user.getCreatedAt());

        data.put("country", profile.getCountry());
        data.put("city", profile.getCity());
        data.put("region", profile.getRegion());
        data.put("householdSize", profile.getHouseholdSize());
        data.put("electricitySource", profile.getElectricitySource());
        data.put("lifestyleType", profile.getLifestyleType());
        data.put("monthlyTargetKgco2e", profile.getMonthlyTargetKgco2e());

        return ResponseEntity.ok(data);
    }

    // Update user profile and preferences
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (payload.containsKey("displayName")) {
            user.setDisplayName((String) payload.get("displayName"));
        }
        if (payload.containsKey("firstName")) {
            user.setFirstName((String) payload.get("firstName"));
        }
        if (payload.containsKey("lastName")) {
            user.setLastName((String) payload.get("lastName"));
        }
        if (payload.containsKey("avatarUrl")) {
            user.setAvatarUrl((String) payload.get("avatarUrl"));
        }
        if (payload.containsKey("preferredUnit")) {
            user.setPreferredUnit((String) payload.get("preferredUnit"));
        }
        if (payload.containsKey("timezone")) {
            user.setTimezone((String) payload.get("timezone"));
        }
        userRepository.save(user);

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserProfile(user.getId()));

        if (payload.containsKey("country")) {
            profile.setCountry((String) payload.get("country"));
        }
        if (payload.containsKey("city")) {
            profile.setCity((String) payload.get("city"));
        }
        if (payload.containsKey("region")) {
            profile.setRegion((String) payload.get("region"));
        }
        if (payload.containsKey("householdSize") && payload.get("householdSize") != null) {
            profile.setHouseholdSize(Short.valueOf(payload.get("householdSize").toString()));
        }
        if (payload.containsKey("electricitySource")) {
            profile.setElectricitySource((String) payload.get("electricitySource"));
        }
        if (payload.containsKey("lifestyleType")) {
            profile.setLifestyleType((String) payload.get("lifestyleType"));
        }
        if (payload.containsKey("monthlyTargetKgco2e") && payload.get("monthlyTargetKgco2e") != null) {
            profile.setMonthlyTargetKgco2e(new BigDecimal(payload.get("monthlyTargetKgco2e").toString()));
        }
        userProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
        ));
    }

    // Change password
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters"));
        }

        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Current password is incorrect"));
            }
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
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
