
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityType;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.ActivityTypeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@Service
public class RecommendationService {

    private final ActivityLogRepository activityLogRepository;
    private final ActivityTypeRepository activityTypeRepository;

    public RecommendationService(
            ActivityLogRepository activityLogRepository,
            ActivityTypeRepository activityTypeRepository) {
        this.activityLogRepository = activityLogRepository;
        this.activityTypeRepository = activityTypeRepository;
    }

    public List<RecommendationItem> getRecommendations(Long userId) {

        LocalDate endDate = LocalDate.now().plusDays(1);
        LocalDate startDate = endDate.minusDays(30);

        var summaries =
                activityLogRepository.findTopEmissionActivityTypes(
                        userId,
                        startDate,
                        endDate,
                        PageRequest.of(0, 3)
                );

        List<RecommendationItem> recommendations = new ArrayList<>();

        for (var summary : summaries) {

            ActivityType activityType =
                    activityTypeRepository
                            .findById(summary.getActivityTypeId())
                            .orElse(null);

            if (activityType == null || !activityType.isActive()) {
                continue;
            }

            String name = activityType.getName();

            recommendations.add(new RecommendationItem(
                    summary.getActivityTypeId(),
                    name,
                    summary.getTotalCo2eKg(),
                    summary.getActivityCount(),
                    getTip(name)
            ));
        }

        return recommendations;
    }

    private String getTip(String activityName) {

        Map<String, String> tips = Map.ofEntries(
                Map.entry("car",
                        "Reduce solo car trips by combining errands, carpooling, or using public transport."),
                Map.entry("bus",
                        "Continue using public transport and consider walking or cycling for short journeys."),
                Map.entry("train",
                        "Prefer rail travel over higher-emission transport options when practical."),
                Map.entry("flight",
                        "Consider replacing short flights with train journeys or combining trips."),
                Map.entry("motorcycle",
                        "Combine journeys, maintain your vehicle, and consider public transport for regular commutes."),
                Map.entry("bicycle",
                        "Keep cycling for suitable journeys to help maintain a low transport footprint."),
                Map.entry("walking",
                        "Continue walking for short journeys whenever it is practical and safe."),
                Map.entry("home_electricity",
                        "Switch off unused appliances, use efficient lighting, and reduce unnecessary electricity consumption."),
                Map.entry("office_electricity",
                        "Turn off unused office equipment and encourage energy-saving practices at work."),
                Map.entry("renewable_electricity",
                        "Continue using renewable electricity where available."),
                Map.entry("beef",
                        "Try replacing some beef meals with plant-based proteins such as beans, lentils, or tofu."),
                Map.entry("chicken",
                        "Consider replacing some meat meals with plant-based protein options."),
                Map.entry("pork",
                        "Try adding more plant-based meals to your weekly meal plan."),
                Map.entry("fish",
                        "Choose suitable plant-based meals sometimes and consider sustainably sourced options."),
                Map.entry("dairy",
                        "Try plant-based milk alternatives where they meet your nutritional needs."),
                Map.entry("vegetarian_meal",
                        "Continue choosing vegetarian meals and consider plant-rich options with a variety of proteins."),
                Map.entry("vegan_meal",
                        "Continue choosing plant-based meals and minimise food waste."),
                Map.entry("clothing",
                        "Buy fewer new items, repair clothing, and consider second-hand purchases."),
                Map.entry("electronics",
                        "Extend device life through repairs and choose refurbished electronics when appropriate."),
                Map.entry("furniture",
                        "Consider repairing, reusing, or buying second-hand furniture before purchasing new items."),
                Map.entry("household_goods",
                        "Choose reusable products and buy only the household supplies you need."),
                Map.entry("landfill_waste",
                        "Separate recyclable materials and compost suitable organic waste where possible."),
                Map.entry("recycling",
                        "Continue sorting recyclable materials correctly and reduce avoidable packaging."),
                Map.entry("composting",
                        "Continue composting suitable organic waste and avoid sending it to landfill.")
        );

        return tips.getOrDefault(
                activityName.toLowerCase(Locale.ROOT),
                "Review this activity and explore practical ways to reduce its environmental impact."
        );
    }

    public record RecommendationItem(
            Short activityTypeId,
            String activityType,
            BigDecimal totalCo2eKg,
            Long activityCount,
            String recommendation
    ) {
    }
}
