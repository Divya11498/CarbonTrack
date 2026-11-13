package com.carbontrack.backend.controller;

import com.carbontrack.backend.auth.JwtService;
import com.carbontrack.backend.entity.PasswordResetToken;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserProfile;
import com.carbontrack.backend.repository.PasswordResetTokenRepository;
import com.carbontrack.backend.repository.UserProfileRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.CustomUserDetailsService;
import com.carbontrack.backend.service.EmailService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.google.client-id:}")
    private String configuredGoogleClientId;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and password are required"));
        }

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.getEmail().trim(),
                                    request.getPassword()
                            )
                    );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails.getUsername());

            User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase()).orElse(null);

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "tokenType", "Bearer",
                    "expiresIn", 3600,
                    "email", userDetails.getUsername(),
                    "name", user != null && user.getDisplayName() != null ? user.getDisplayName() : "User",
                    "avatarUrl", user != null && user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            ));

        } catch (org.springframework.security.core.AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getName() == null || request.getName().isBlank()
                || request.getPassword() == null
                || request.getPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error",
                    "Name, valid email, and password of at least 8 characters are required"
            ));
        }

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with this email already exists"));
        }

        String[] nameParts = request.getName().trim().split("\\s+", 2);

        User user = new User();
        user.setEmail(email);
        user.setFirstName(nameParts[0]);
        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        user.setDisplayName(request.getName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        String seed = "ct-" + Integer.toHexString(email.hashCode());
        user.setAvatarSeed(seed);
        user.setAvatarUrl("https://blobatar.dev/avatar/" + seed + "?gen=2");

        User savedUser = userRepository.save(user);

        // Initialize default user profile
        UserProfile profile = new UserProfile(savedUser.getId());
        userProfileRepository.save(profile);
        emailService.sendWelcomeEmail(savedUser);

        // Generate token for automatic login after registration
        String token = jwtService.generateToken(savedUser.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Account created successfully",
                "token", token,
                "tokenType", "Bearer",
                "userId", savedUser.getId(),
                "email", savedUser.getEmail(),
                "name", savedUser.getDisplayName(),
                "avatarUrl", savedUser.getAvatarUrl()
        ));
    }

    // Google OAuth login & registration
    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody Map<String, String> payload) {
        String credential = payload.get("credential");
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google credential token is required"));
        }

        try {
            // Parse Google ID Token JWT payload
            String[] parts = credential.split("\\.");
            if (parts.length < 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Malformed Google credential token"));
            }

            String jsonPayload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JsonNode claims = objectMapper.readTree(jsonPayload);

            String iss = claims.path("iss").asText();
            if (!"accounts.google.com".equals(iss) && !"https://accounts.google.com".equals(iss)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token issuer"));
            }

            String aud = claims.path("aud").asText();
            if (configuredGoogleClientId != null && !configuredGoogleClientId.isBlank()
                    && !configuredGoogleClientId.trim().equals(aud)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Google token audience does not match CarbonTrack Client ID"));
            }

            long exp = claims.path("exp").asLong(0);
            if (exp > 0 && exp * 1000 < System.currentTimeMillis()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Google token has expired"));
            }

            String email = claims.path("email").asText();
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email not provided in Google credential"));
            }
            email = email.trim().toLowerCase();

            String name = claims.path("name").asText("User");
            String picture = claims.path("picture").asText("");
            String sub = claims.path("sub").asText("");

            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            User user;

            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                if (user.getGoogleId() == null && !sub.isBlank()) {
                    user.setGoogleId(sub);
                }
                if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && !picture.isBlank()) {
                    user.setAvatarUrl(picture);
                }
                userRepository.save(user);
            } else {
                user = new User();
                user.setEmail(email);
                String[] nameParts = name.trim().split("\\s+", 2);
                user.setFirstName(nameParts[0]);
                user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
                user.setDisplayName(name.trim());
                user.setGoogleId(sub);
                String seed = "ct-" + Integer.toHexString(email.hashCode());
                user.setAvatarSeed(seed);
                user.setAvatarUrl(picture != null && !picture.isBlank()
                        ? picture
                        : "https://blobatar.dev/avatar/" + seed + "?gen=2");
                user.setRole("USER");
                user = userRepository.save(user);

                UserProfile profile = new UserProfile(user.getId());
                userProfileRepository.save(profile);
                emailService.sendWelcomeEmail(user);
            }

            String appToken = jwtService.generateToken(user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "token", appToken,
                    "tokenType", "Bearer",
                    "expiresIn", 3600,
                    "email", user.getEmail(),
                    "name", user.getDisplayName() != null ? user.getDisplayName() : name,
                    "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            ));

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Failed to verify Google token: " + ex.getMessage()));
        }
    }

    // Forgot password request
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String rawToken = UUID.randomUUID().toString().replace("-", "")
                    + UUID.randomUUID().toString().replace("-", "");
            String tokenHash = hashToken(rawToken);

            OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(1);
            PasswordResetToken resetToken = new PasswordResetToken(user.getId(), tokenHash, expiresAt);
            passwordResetTokenRepository.save(resetToken);

            Map<String, Object> emailResult = emailService.sendPasswordResetEmail(user, rawToken);
            if ("SENT".equals(emailResult.get("status"))) {
                return ResponseEntity.ok(Map.of(
                        "message", "If this email is registered, password reset instructions have been sent to your inbox."
                ));
            }

            // When SMTP is not configured locally, return devResetToken cleanly without claiming email was sent
            return ResponseEntity.ok(Map.of(
                    "message", "SMTP is not configured locally. Use the reset token below to complete your password reset.",
                    "smtpConfigured", false,
                    "devResetToken", rawToken
            ));
        }

        // Return same message to prevent email enumeration
        return ResponseEntity.ok(Map.of(
                "message", "If this email is registered, password reset instructions have been sent."
        ));
    }

    // Verify reset token validity
    @GetMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Token is required"));
        }

        String tokenHash = hashToken(token.trim());
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("valid", false, "error", "Invalid reset token"));
        }

        PasswordResetToken resetToken = tokenOpt.get();
        if (resetToken.isExpired()) {
            return ResponseEntity.ok(Map.of("valid", false, "error", "Reset token has expired"));
        }

        if (resetToken.isUsed()) {
            return ResponseEntity.ok(Map.of("valid", false, "error", "Reset token has already been used"));
        }

        return ResponseEntity.ok(Map.of("valid", true));
    }

    // Reset password with token
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "A valid token and a new password with at least 8 characters are required"
            ));
        }

        String tokenHash = hashToken(token.trim());
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid password reset token"));
        }

        PasswordResetToken resetToken = tokenOpt.get();
        if (resetToken.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password reset token has expired"));
        }
        if (resetToken.isUsed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password reset token has already been used"));
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        return ResponseEntity.ok(Map.of(
                "message", "Password has been successfully reset. You may now sign in."
        ));
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
