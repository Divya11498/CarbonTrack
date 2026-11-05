package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    private static final Map<Short, String> ACTIVITY_NAMES = Map.ofEntries(
            Map.entry((short) 1, "Car Travel"),
            Map.entry((short) 2, "Bus Commute"),
            Map.entry((short) 3, "Train Ride"),
            Map.entry((short) 4, "Flight Travel"),
            Map.entry((short) 5, "Motorcycle"),
            Map.entry((short) 8, "Home Electricity"),
            Map.entry((short) 9, "Office Electricity"),
            Map.entry((short) 11, "Beef"),
            Map.entry((short) 12, "Chicken"),
            Map.entry((short) 13, "Pork"),
            Map.entry((short) 15, "Dairy"),
            Map.entry((short) 18, "Clothing Purchase"),
            Map.entry((short) 19, "Electronics"),
            Map.entry((short) 22, "Landfill Waste")
    );

    public RecommendationController(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getRecommendations(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<ActivityLog> activities = activityLogRepository.findRecentByUserId(user.getId(), thirtyDaysAgo);

        // Group emissions by activity type
        Map<Short, BigDecimal> activityTotals = new HashMap<>();
        for (ActivityLog act : activities) {
            Short typeId = act.getActivityTypeId();
            BigDecimal co2 = act.getCo2eKg() != null ? act.getCo2eKg() : BigDecimal.ZERO;
            activityTotals.put(typeId, activityTotals.getOrDefault(typeId, BigDecimal.ZERO).add(co2));
        }

        // Get top 3 emission drivers
        List<Map.Entry<Short, BigDecimal>> topActivities = activityTotals.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(3)
                .collect(Collectors.toList());

        List<Map<String, Object>> recommendations = new ArrayList<>();

        if (topActivities.isEmpty()) {
            // Provide general proactive recommendations
            recommendations.add(buildRecommendation(
                    (short) 1,
                    "Transport Optimization",
                    "Car travel is typically the largest contributor to everyday emissions.",
                    "Switch 2 commutes a week to public transit or cycling to cut transport footprint by 35%.",
                    new BigDecimal("18.50"),
                    1
            ));
            recommendations.add(buildRecommendation(
                    (short) 8,
                    "Smart Energy Conservation",
                    "Home appliances and standby power account for constant background emissions.",
                    "Use smart power strips and switch off idle electronics to reduce monthly electricity use.",
                    new BigDecimal("12.00"),
                    2
            ));
            recommendations.add(buildRecommendation(
                    (short) 11,
                    "Plant-Rich Dining",
                    "Animal agriculture is resource-intensive with significant emissions per kg.",
                    "Try 'Meatless Mondays' or replace 3 beef meals weekly with plant-based alternatives.",
                    new BigDecimal("15.20"),
                    3
            ));
        } else {
            int priority = 1;
            for (Map.Entry<Short, BigDecimal> entry : topActivities) {
                Short typeId = entry.getKey();
                BigDecimal totalCo2 = entry.getValue();
                String activityName = ACTIVITY_NAMES.getOrDefault(typeId, "High-Emission Activity");

                String reason = String.format("Generated %s kg CO₂e in the last 30 days, ranking among your highest impact sources.",
                        totalCo2.setScale(1, RoundingMode.HALF_UP));

                String suggestion;
                BigDecimal estimatedSavings = totalCo2.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);

                if (typeId == 1 || typeId == 5) {
                    suggestion = "Carpool, walk, or replace short driving trips under 3 km with cycling to save up to 30% on fuel emissions.";
                } else if (typeId == 4) {
                    suggestion = "Choose direct rail options for domestic travel where feasible, or look into verified flight carbon offsets.";
                } else if (typeId == 8 || typeId == 9) {
                    suggestion = "Shift thermostat settings by 1°C and replace high-wattage bulbs with LEDs for an estimated 25% reduction.";
                } else if (typeId == 11 || typeId == 13) {
                    suggestion = "Substitute 2 portions with poultry or plant proteins like lentils to save up to 40% in food emissions.";
                } else {
                    suggestion = "Review and optimize frequency of this activity to trim your carbon footprint over the next month.";
                }

                recommendations.add(buildRecommendation(
                        typeId,
                        activityName,
                        reason,
                        suggestion,
                        estimatedSavings,
                        priority++
                ));
            }
        }

        return ResponseEntity.ok(recommendations);
    }

    private Map<String, Object> buildRecommendation(
            Short typeId,
            String activityType,
            String reason,
            String suggestion,
            BigDecimal estimatedSavings,
            int priority) {
        Map<String, Object> map = new HashMap<>();
        map.put("activityTypeId", typeId);
        map.put("activityType", activityType);
        map.put("reason", reason);
        map.put("suggestion", suggestion);
        map.put("estimatedCo2eSavingsKg", estimatedSavings);
        map.put("priority", priority);
        return map;
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
