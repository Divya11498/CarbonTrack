package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.NotificationLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.NotificationLogRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationLogRepository notificationLogRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationController(
            NotificationLogRepository notificationLogRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.notificationLogRepository = notificationLogRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<?> getMyNotifications(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<NotificationLog> logs = notificationLogRepository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId());
        long unreadCount = notificationLogRepository.countByUserIdAndIsReadFalse(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("smtpConfigured", emailService.isSmtpConfigured());
        result.put("unreadCount", unreadCount);
        result.put("notifications", logs);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return notificationLogRepository.findById(id)
                .filter(n -> n.getUserId().equals(user.getId()))
                .map(n -> {
                    n.setIsRead(true);
                    n.setReadAt(java.time.OffsetDateTime.now());
                    notificationLogRepository.save(n);
                    return ResponseEntity.ok(Map.of("success", true, "id", id, "isRead", true));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<NotificationLog> unreadList = notificationLogRepository.findByUserIdAndIsReadFalse(user.getId());
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        unreadList.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(now);
        });
        notificationLogRepository.saveAll(unreadList);
        return ResponseEntity.ok(Map.of("success", true, "markedCount", unreadList.size()));
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
