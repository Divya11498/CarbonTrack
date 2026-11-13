package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;

    public AnalyticsController(UserRepository userRepository, AnalyticsService analyticsService) {
        this.userRepository = userRepository;
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(analyticsService.getSummary(user.getId(), period, startDate, endDate));
    }

    @GetMapping("/trends")
    public ResponseEntity<?> getTrends(
            @RequestParam(defaultValue = "30d") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(analyticsService.getTrends(user.getId(), period, startDate, endDate));
    }

    @GetMapping("/benchmarks")
    public ResponseEntity<?> getBenchmarks(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(analyticsService.getBenchmarks(user.getId()));
    }

    @GetMapping("/peer-benchmarking")
    public ResponseEntity<?> getPeerBenchmarking(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(analyticsService.getPeerBenchmarking(user.getId()));
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
