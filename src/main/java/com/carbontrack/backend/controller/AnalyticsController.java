
package com.carbontrack.backend.controller;

import com.carbontrack.backend.service.ActivityLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final ActivityLogService activityLogService;

    public AnalyticsController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping("/daily/{userId}")
    public ResponseEntity<Map<String, Object>> getDailyEmissions(
            @PathVariable Long userId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "period", "daily",
                "date", date,
                "co2eKg", activityLogService.getDailyEmissions(userId, date)
        ));
    }

    @GetMapping("/weekly/{userId}")
    public ResponseEntity<Map<String, Object>> getWeeklyEmissions(
            @PathVariable Long userId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "period", "weekly",
                "date", date,
                "co2eKg", activityLogService.getWeeklyEmissions(userId, date)
        ));
    }

    @GetMapping("/monthly/{userId}")
    public ResponseEntity<Map<String, Object>> getMonthlyEmissions(
            @PathVariable Long userId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "period", "monthly",
                "date", date,
                "co2eKg", activityLogService.getMonthlyEmissions(userId, date)
        ));
    }
}
