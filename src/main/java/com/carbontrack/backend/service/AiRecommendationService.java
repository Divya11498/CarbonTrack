package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.Recommendation;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.RecommendationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);

    private final RecommendationRepository recommendationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final Map<Short, String> CATEGORY_NAMES = Map.of(
            (short) 1, "Transport",
            (short) 2, "Electricity",
            (short) 3, "Food",
            (short) 4, "Shopping",
            (short) 5, "Waste"
    );

    private static final Map<Short, String> ACTIVITY_NAMES = Map.ofEntries(
            Map.entry((short) 1, "Car Travel"),
            Map.entry((short) 2, "Bus Commute"),
            Map.entry((short) 3, "Train Ride"),
            Map.entry((short) 4, "Flight Travel"),
            Map.entry((short) 5, "Motorcycle"),
            Map.entry((short) 6, "Bicycle"),
            Map.entry((short) 7, "Walking"),
            Map.entry((short) 8, "Home Electricity"),
            Map.entry((short) 9, "Office Electricity"),
            Map.entry((short) 10, "Renewable Electricity"),
            Map.entry((short) 11, "Beef"),
            Map.entry((short) 12, "Chicken"),
            Map.entry((short) 13, "Pork"),
            Map.entry((short) 14, "Fish"),
            Map.entry((short) 15, "Dairy"),
            Map.entry((short) 16, "Vegetarian Meal"),
            Map.entry((short) 17, "Vegan Meal"),
            Map.entry((short) 18, "Clothing Purchase"),
            Map.entry((short) 19, "Electronics"),
            Map.entry((short) 22, "Landfill Waste")
    );

    public AiRecommendationService(
            RecommendationRepository recommendationRepository,
            ActivityLogRepository activityLogRepository,
            GoalRepository goalRepository) {
        this.recommendationRepository = recommendationRepository;
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /**
     * Retrieves active/in-progress recommendations for user.
     * Generates fresh personalized recommendations if none exist or if refresh requested.
     */
    @Transactional
    public List<Recommendation> getRecommendations(User user, boolean forceRefresh) {
        if (!forceRefresh) {
            List<Recommendation> existing = recommendationRepository
                    .findByUserIdAndStatusInOrderByPriorityAscGeneratedAtDesc(
                            user.getId(), List.of("ACTIVE", "IN_PROGRESS"));
            if (!existing.isEmpty()) {
                return existing;
            }
        }

        // Generate fresh recommendations
        return generateAndSaveRecommendations(user);
    }

    /**
     * Retrieves completed recommendations for tracking impact.
     */
    public List<Recommendation> getCompletedRecommendations(User user) {
        return recommendationRepository.findByUserIdAndStatusOrderByPriorityAsc(user.getId(), "COMPLETED");
    }

    /**
     * Start working on a recommendation (mark IN_PROGRESS).
     */
    @Transactional
    public Recommendation startRecommendation(User user, Long recommendationId) {
        Recommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found"));

        if (!rec.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to recommendation");
        }

        rec.setStatus("IN_PROGRESS");
        rec.setStartedAt(OffsetDateTime.now());
        return recommendationRepository.save(rec);
    }

    /**
     * Complete a recommendation and record actual carbon savings.
     */
    @Transactional
    public Recommendation completeRecommendation(User user, Long recommendationId, BigDecimal actualSavings) {
        Recommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found"));

        if (!rec.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to recommendation");
        }

        rec.setStatus("COMPLETED");
        rec.setCompletedAt(OffsetDateTime.now());

        if (actualSavings != null && actualSavings.compareTo(BigDecimal.ZERO) > 0) {
            rec.setActualCo2eSavingsKg(actualSavings.setScale(2, RoundingMode.HALF_UP));
        } else {
            rec.setActualCo2eSavingsKg(rec.getEstimatedCo2eSavingsKg());
        }

        return recommendationRepository.save(rec);
    }

    /**
     * Dismiss a recommendation.
     */
    @Transactional
    public Recommendation dismissRecommendation(User user, Long recommendationId) {
        Recommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found"));

        if (!rec.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to recommendation");
        }

        rec.setStatus("DISMISSED");
        return recommendationRepository.save(rec);
    }

    /**
     * Synthesizes comprehensive AI Insights and analytical summary.
     */
    public Map<String, Object> getAiInsights(User user) {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<ActivityLog> activities = activityLogRepository.findRecentByUserId(user.getId(), thirtyDaysAgo);

        BigDecimal totalFootprint = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();
        Map<Short, BigDecimal> activityTotals = new HashMap<>();

        // Divide into two 15-day periods to compute trend
        LocalDate fifteenDaysAgo = LocalDate.now().minusDays(15);
        BigDecimal recentPeriod = BigDecimal.ZERO;
        BigDecimal priorPeriod = BigDecimal.ZERO;

        for (ActivityLog act : activities) {
            BigDecimal co2 = act.getCo2eKg() != null ? act.getCo2eKg() : BigDecimal.ZERO;
            totalFootprint = totalFootprint.add(co2);

            String catName = CATEGORY_NAMES.getOrDefault(act.getCategoryId(), "General");
            categoryTotals.put(catName, categoryTotals.getOrDefault(catName, BigDecimal.ZERO).add(co2));

            Short typeId = act.getActivityTypeId();
            if (typeId != null) {
                activityTotals.put(typeId, activityTotals.getOrDefault(typeId, BigDecimal.ZERO).add(co2));
            }

            LocalDate logDate = act.getLogDate();
            if (logDate != null) {
                if (logDate.isAfter(fifteenDaysAgo) || logDate.isEqual(fifteenDaysAgo)) {
                    recentPeriod = recentPeriod.add(co2);
                } else {
                    priorPeriod = priorPeriod.add(co2);
                }
            }
        }

        // Top emission driver
        Map.Entry<Short, BigDecimal> topDriverEntry = activityTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        String topDriverName = topDriverEntry != null ?
                ACTIVITY_NAMES.getOrDefault(topDriverEntry.getKey(), "General Consumption") : "Daily Activities";
        BigDecimal topDriverCo2 = topDriverEntry != null ? topDriverEntry.getValue() : BigDecimal.ZERO;
        BigDecimal topDriverPercent = totalFootprint.compareTo(BigDecimal.ZERO) > 0 ?
                topDriverCo2.multiply(BigDecimal.valueOf(100)).divide(totalFootprint, 1, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // Historical Trend
        String trendDescription;
        BigDecimal trendPercent = BigDecimal.ZERO;
        if (priorPeriod.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = recentPeriod.subtract(priorPeriod);
            trendPercent = diff.multiply(BigDecimal.valueOf(100)).divide(priorPeriod, 1, RoundingMode.HALF_UP);
            if (trendPercent.compareTo(BigDecimal.ZERO) < 0) {
                trendDescription = String.format("Down %s%% compared to the previous 15-day period. Great momentum!", trendPercent.abs());
            } else {
                trendDescription = String.format("Up +%s%% compared to the previous 15-day period.", trendPercent);
            }
        } else {
            trendDescription = "Baseline established across your recent logged activities.";
        }

        // Goal Progress
        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
        String goalProgressSummary = "No active reduction goals currently set.";
        BigDecimal goalPercentMet = BigDecimal.ZERO;
        if (!activeGoals.isEmpty()) {
            Goal goal = activeGoals.get(0);
            BigDecimal target = goal.getTargetValue() != null ? goal.getTargetValue() : BigDecimal.ZERO;
            if (target.compareTo(BigDecimal.ZERO) > 0) {
                goalPercentMet = totalFootprint.multiply(BigDecimal.valueOf(100)).divide(target, 0, RoundingMode.HALF_UP);
                goalProgressSummary = String.format("%s%% of your %s kg allowance used this period (%s kg remaining).",
                        goalPercentMet, target.setScale(0, RoundingMode.HALF_UP),
                        target.subtract(totalFootprint).max(BigDecimal.ZERO).setScale(1, RoundingMode.HALF_UP));
            }
        }

        // Overall Impact Stats
        BigDecimal totalActualSavings = recommendationRepository.sumActualSavingsByUserId(user.getId());
        BigDecimal totalPotentialSavings = recommendationRepository.sumPotentialSavingsByUserId(user.getId());
        long completedCount = recommendationRepository.countByUserIdAndStatus(user.getId(), "COMPLETED");
        long inProgressCount = recommendationRepository.countByUserIdAndStatus(user.getId(), "IN_PROGRESS");
        long activeCount = recommendationRepository.countByUserIdAndStatus(user.getId(), "ACTIVE");

        Map<String, Object> insights = new LinkedHashMap<>();
        insights.put("topEmissionDriver", String.format("%s (%s kg CO₂e — %s%% of total)", topDriverName, topDriverCo2.setScale(1, RoundingMode.HALF_UP), topDriverPercent));
        insights.put("immediateImprovementArea", determineImmediateImprovement(categoryTotals, topDriverName));
        insights.put("historicalTrend", trendDescription);
        insights.put("trendPercent", trendPercent);
        insights.put("highestImpactAction", String.format("Optimizing %s represents your single biggest opportunity to eliminate up to %s kg CO₂e.",
                topDriverName, topDriverCo2.multiply(new BigDecimal("0.35")).setScale(1, RoundingMode.HALF_UP)));
        insights.put("goalsProgress", goalProgressSummary);
        insights.put("goalPercentMet", goalPercentMet);
        insights.put("totalFootprintKg", totalFootprint.setScale(1, RoundingMode.HALF_UP));
        insights.put("totalActualSavingsKg", totalActualSavings.setScale(1, RoundingMode.HALF_UP));
        insights.put("totalPotentialSavingsKg", totalPotentialSavings.setScale(1, RoundingMode.HALF_UP));
        insights.put("activeCount", activeCount);
        insights.put("inProgressCount", inProgressCount);
        insights.put("completedCount", completedCount);
        insights.put("aiModel", (geminiApiKey != null && !geminiApiKey.isBlank()) ? "Gemini 1.5 Flash" : "CarbonTrack Analytics Engine");
        insights.put("generatedAt", OffsetDateTime.now());

        return insights;
    }

    private String determineImmediateImprovement(Map<String, BigDecimal> categoryTotals, String topDriver) {
        if (categoryTotals.isEmpty()) {
            return "Log daily commute, diet, or electricity consumption to pinpoint high-yield reductions.";
        }
        Map.Entry<String, BigDecimal> highestCat = categoryTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        if (highestCat != null) {
            return String.format("%s is your highest intensity category (%s kg CO₂e). Focusing here will yield the fastest gains.",
                    highestCat.getKey(), highestCat.getValue().setScale(1, RoundingMode.HALF_UP));
        }
        return "Targeting " + topDriver + " will produce immediate reductions.";
    }

    /**
     * Generates personalized recommendations from user telemetry.
     * Uses Gemini AI when configured, with explainable rule-based analytical engine as seamless fallback.
     */
    @Transactional
    public List<Recommendation> generateAndSaveRecommendations(User user) {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<ActivityLog> activities = activityLogRepository.findRecentByUserId(user.getId(), thirtyDaysAgo);
        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");

        // Aggregated Metrics (Non-PII)
        BigDecimal totalFootprint = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryTotals = new HashMap<>();
        Map<Short, BigDecimal> activityTotals = new HashMap<>();

        for (ActivityLog act : activities) {
            BigDecimal co2 = act.getCo2eKg() != null ? act.getCo2eKg() : BigDecimal.ZERO;
            totalFootprint = totalFootprint.add(co2);

            String catName = CATEGORY_NAMES.getOrDefault(act.getCategoryId(), "General");
            categoryTotals.put(catName, categoryTotals.getOrDefault(catName, BigDecimal.ZERO).add(co2));

            Short typeId = act.getActivityTypeId();
            if (typeId != null) {
                activityTotals.put(typeId, activityTotals.getOrDefault(typeId, BigDecimal.ZERO).add(co2));
            }
        }

        List<Recommendation> generatedList = new ArrayList<>();

        // Attempt Gemini API if configured
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                generatedList = generateViaGeminiApi(user.getId(), totalFootprint, categoryTotals, activityTotals, activeGoals);
            } catch (Exception e) {
                log.warn("Gemini API call failed or timed out. Falling back to CarbonTrack Rule-Based Engine: {}", e.getMessage());
            }
        }

        // Fallback or default: Explainable Rule-Based Analytical Engine
        if (generatedList.isEmpty()) {
            generatedList = generateViaRuleBasedEngine(user.getId(), totalFootprint, categoryTotals, activityTotals, activeGoals);
        }

        // Clear outdated ACTIVE recommendations so fresh ones are presented
        List<Recommendation> oldActive = recommendationRepository
                .findByUserIdAndStatusOrderByPriorityAsc(user.getId(), "ACTIVE");
        if (!oldActive.isEmpty()) {
            recommendationRepository.deleteAll(oldActive);
        }

        return recommendationRepository.saveAll(generatedList);
    }

    /**
     * Explainable Data-Driven Rule Engine
     * Covers: Energy Optimization, Transportation, Waste Management,
     * Water Conservation, Carbon Reduction, Sustainability Goals.
     */
    private List<Recommendation> generateViaRuleBasedEngine(
            Long userId,
            BigDecimal totalFootprint,
            Map<String, BigDecimal> categoryTotals,
            Map<Short, BigDecimal> activityTotals,
            List<Goal> activeGoals) {

        List<Recommendation> list = new ArrayList<>();
        short priority = 1;

        BigDecimal transportCo2 = categoryTotals.getOrDefault("Transport", BigDecimal.ZERO);
        BigDecimal electricityCo2 = categoryTotals.getOrDefault("Electricity", BigDecimal.ZERO);
        BigDecimal foodCo2 = categoryTotals.getOrDefault("Food", BigDecimal.ZERO);
        BigDecimal wasteCo2 = categoryTotals.getOrDefault("Waste", BigDecimal.ZERO);

        // 1. Carbon Reduction (Top Overall Driver)
        Map.Entry<Short, BigDecimal> topDriver = activityTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        if (topDriver != null && topDriver.getValue().compareTo(BigDecimal.ZERO) > 0) {
            String driverName = ACTIVITY_NAMES.getOrDefault(topDriver.getKey(), "Primary Activity");
            BigDecimal driverCo2 = topDriver.getValue();
            BigDecimal potentialSavings = driverCo2.multiply(new BigDecimal("0.35")).setScale(2, RoundingMode.HALF_UP);

            Recommendation rec = new Recommendation();
            rec.setUserId(userId);
            rec.setActivityTypeId(topDriver.getKey());
            rec.setCategoryName("Carbon Reduction");
            rec.setTitle("Tackle Your #1 Emission Driver: " + driverName);
            rec.setProblemIdentified(String.format("%s generated %s kg CO₂e in the last 30 days, representing your highest individual emission contributor.",
                    driverName, driverCo2.setScale(1, RoundingMode.HALF_UP)));
            rec.setDescription("Reduce frequency or transition 30% of this activity to verified low-carbon alternatives to achieve significant rapid footprint reduction.");
            rec.setEstimatedCo2eSavingsKg(potentialSavings);
            rec.setDifficultyLevel("MEDIUM");
            rec.setPriorityLevel("HIGH");
            rec.setTimeframe("Next 14 days");
            rec.setPriority(priority++);
            rec.setIsAiGenerated(true);
            rec.setAiModel("CarbonTrack Analytics Engine");
            list.add(rec);
        }

        // 2. Transportation
        BigDecimal carCo2 = activityTotals.getOrDefault((short) 1, BigDecimal.ZERO);
        BigDecimal flightCo2 = activityTotals.getOrDefault((short) 4, BigDecimal.ZERO);
        Recommendation transRec = new Recommendation();
        transRec.setUserId(userId);
        transRec.setCategoryName("Transportation");

        if (flightCo2.compareTo(BigDecimal.ZERO) > 0) {
            transRec.setTitle("High-Altitude Flight Offsetting & Route Optimization");
            transRec.setProblemIdentified(String.format("Aviation travel generated %s kg CO₂e. Aviation is among the most carbon-dense transit modes per kilometer.",
                    flightCo2.setScale(1, RoundingMode.HALF_UP)));
            transRec.setDescription("Opt for direct routes, replace regional domestic legs with electric train travel, and support certified Gold Standard carbon offsets.");
            transRec.setEstimatedCo2eSavingsKg(flightCo2.multiply(new BigDecimal("0.25")).setScale(2, RoundingMode.HALF_UP));
            transRec.setDifficultyLevel("HARD");
            transRec.setPriorityLevel("HIGH");
            transRec.setTimeframe("Upcoming trip");
        } else if (carCo2.compareTo(BigDecimal.ZERO) > 0 || transportCo2.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal base = carCo2.compareTo(BigDecimal.ZERO) > 0 ? carCo2 : transportCo2;
            transRec.setTitle("Transition Short Commutes to Public Transit & Cycling");
            transRec.setProblemIdentified(String.format("Personal vehicle travel accounts for %s kg CO₂e across your recent records.",
                    base.setScale(1, RoundingMode.HALF_UP)));
            transRec.setDescription("Switch 2 commutes per week to electric rail, bus, or cycling for trips under 5 km to trim your transit footprint by up to 35%.");
            transRec.setEstimatedCo2eSavingsKg(base.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP).max(new BigDecimal("14.50")));
            transRec.setDifficultyLevel("EASY");
            transRec.setPriorityLevel("HIGH");
            transRec.setTimeframe("This week");
        } else {
            transRec.setTitle("Adopt Multi-Modal Low-Carbon Commuting");
            transRec.setProblemIdentified("Vehicle transit typically represents over 40% of standard household emissions.");
            transRec.setDescription("Prioritize walking and cycling for neighborhood errands to establish a zero-emission transit habit.");
            transRec.setEstimatedCo2eSavingsKg(new BigDecimal("16.00"));
            transRec.setDifficultyLevel("EASY");
            transRec.setPriorityLevel("MEDIUM");
            transRec.setTimeframe("Ongoing");
        }
        transRec.setPriority(priority++);
        transRec.setIsAiGenerated(true);
        transRec.setAiModel("CarbonTrack Analytics Engine");
        list.add(transRec);

        // 3. Energy Optimization
        Recommendation energyRec = new Recommendation();
        energyRec.setUserId(userId);
        energyRec.setCategoryName("Energy Optimization");
        if (electricityCo2.compareTo(BigDecimal.ZERO) > 0) {
            energyRec.setTitle("Optimize Standby Power & HVAC Thermostat Temperature");
            energyRec.setProblemIdentified(String.format("Electricity consumption contributed %s kg CO₂e to your footprint over the past month.",
                    electricityCo2.setScale(1, RoundingMode.HALF_UP)));
            energyRec.setDescription("Adjust indoor thermostat by 1°C (2°F) and use smart power strips to eliminate phantom standby power drawn by idle entertainment and office hardware.");
            energyRec.setEstimatedCo2eSavingsKg(electricityCo2.multiply(new BigDecimal("0.22")).setScale(2, RoundingMode.HALF_UP).max(new BigDecimal("12.00")));
            energyRec.setDifficultyLevel("EASY");
            energyRec.setPriorityLevel("HIGH");
            energyRec.setTimeframe("Immediate");
        } else {
            energyRec.setTitle("Convert Lighting & Appliances to Energy Star Ratings");
            energyRec.setProblemIdentified("Residential lighting and refrigeration run continuously, creating ongoing baseline emissions.");
            energyRec.setDescription("Swap standard fixtures for high-efficiency LEDs and inquire about green renewable tariffs with your local utility provider.");
            energyRec.setEstimatedCo2eSavingsKg(new BigDecimal("11.50"));
            energyRec.setDifficultyLevel("MEDIUM");
            energyRec.setPriorityLevel("MEDIUM");
            energyRec.setTimeframe("Next 30 days");
        }
        energyRec.setPriority(priority++);
        energyRec.setIsAiGenerated(true);
        energyRec.setAiModel("CarbonTrack Analytics Engine");
        list.add(energyRec);

        // 4. Waste Management
        Recommendation wasteRec = new Recommendation();
        wasteRec.setUserId(userId);
        wasteRec.setCategoryName("Waste Management");
        if (wasteCo2.compareTo(BigDecimal.ZERO) > 0) {
            wasteRec.setTitle("Divert Organic & Packaging Waste from Landfills");
            wasteRec.setProblemIdentified(String.format("Recorded waste generation generated %s kg CO₂e. Anaerobic landfill decomposition releases potent methane gas.",
                    wasteCo2.setScale(1, RoundingMode.HALF_UP)));
            wasteRec.setDescription("Implement household composting for organic food scraps and eliminate single-use grocery plastic bags to reduce landfill volume.");
            wasteRec.setEstimatedCo2eSavingsKg(wasteCo2.multiply(new BigDecimal("0.40")).setScale(2, RoundingMode.HALF_UP).max(new BigDecimal("8.00")));
        } else {
            wasteRec.setTitle("Zero-Waste Packaging & Circular Recycling Habits");
            wasteRec.setProblemIdentified("Packaging materials and discarded goods contribute hidden upstream extraction emissions.");
            wasteRec.setDescription("Carry reusable totes, choose unpackaged produce, and ensure clean separation of recyclable cardboard and containers.");
            wasteRec.setEstimatedCo2eSavingsKg(new BigDecimal("7.50"));
        }
        wasteRec.setDifficultyLevel("EASY");
        wasteRec.setPriorityLevel("MEDIUM");
        wasteRec.setTimeframe("Daily routine");
        wasteRec.setPriority(priority++);
        wasteRec.setIsAiGenerated(true);
        wasteRec.setAiModel("CarbonTrack Analytics Engine");
        list.add(wasteRec);

        // 5. Water Conservation
        Recommendation waterRec = new Recommendation();
        waterRec.setUserId(userId);
        waterRec.setCategoryName("Water Conservation");
        waterRec.setTitle("Install Low-Flow Aerators & Optimize Hot Water Usage");
        waterRec.setProblemIdentified("Heating residential water for showers and dishwashing consumes high kilowatt-hours of electrical/gas energy.");
        waterRec.setDescription("Install water-efficient showerheads and reduce shower times by 2 minutes to save both hundreds of gallons of water and significant heating energy.");
        waterRec.setEstimatedCo2eSavingsKg(new BigDecimal("9.20"));
        waterRec.setDifficultyLevel("EASY");
        waterRec.setPriorityLevel("MEDIUM");
        waterRec.setTimeframe("This week");
        waterRec.setPriority(priority++);
        waterRec.setIsAiGenerated(true);
        waterRec.setAiModel("CarbonTrack Analytics Engine");
        list.add(waterRec);

        // 6. Sustainability Goals
        Recommendation goalRec = new Recommendation();
        goalRec.setUserId(userId);
        goalRec.setCategoryName("Sustainability Goals");
        if (!activeGoals.isEmpty()) {
            Goal currentGoal = activeGoals.get(0);
            goalRec.setTitle("Accelerate Target: " + currentGoal.getTitle());
            goalRec.setProblemIdentified(String.format("You are actively pursuing your %s reduction target of %s kg CO₂e.",
                    currentGoal.getPeriodType().toLowerCase(), currentGoal.getTargetValue()));
            goalRec.setDescription("Consistently logging every daily journey and energy bill provides real-time alerts before exceeding monthly carbon budget limits.");
            goalRec.setEstimatedCo2eSavingsKg(currentGoal.getTargetValue().multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP));
        } else {
            goalRec.setTitle("Establish Your First 10% Monthly Reduction Goal");
            goalRec.setProblemIdentified("Setting clear numerical targets increases long-term sustainability habit retention by over 90%.");
            goalRec.setDescription("Define a monthly carbon ceiling in the Goals section to benchmark your progress and earn community achievements.");
            goalRec.setEstimatedCo2eSavingsKg(new BigDecimal("15.00"));
        }
        goalRec.setDifficultyLevel("EASY");
        goalRec.setPriorityLevel("MEDIUM");
        goalRec.setTimeframe("This month");
        goalRec.setPriority(priority);
        goalRec.setIsAiGenerated(true);
        goalRec.setAiModel("CarbonTrack Analytics Engine");
        list.add(goalRec);

        return list;
    }

    /**
     * Connects to Google Gemini API to synthesize bespoke AI recommendations from aggregated metrics.
     */
    private List<Recommendation> generateViaGeminiApi(
            Long userId,
            BigDecimal totalFootprint,
            Map<String, BigDecimal> categoryTotals,
            Map<Short, BigDecimal> activityTotals,
            List<Goal> activeGoals) throws Exception {

        String geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + geminiApiKey;

        StringBuilder telemetryPrompt = new StringBuilder();
        telemetryPrompt.append("You are an expert environmental sustainability AI for the CarbonTrack platform.\n");
        telemetryPrompt.append("Analyze the following anonymous user sustainability telemetry (past 30 days):\n");
        telemetryPrompt.append(String.format("- Total Footprint: %s kg CO2e\n", totalFootprint.setScale(1, RoundingMode.HALF_UP)));
        telemetryPrompt.append("- Category Breakdown:\n");
        categoryTotals.forEach((cat, co2) -> telemetryPrompt.append(String.format("  * %s: %s kg CO2e\n", cat, co2.setScale(1, RoundingMode.HALF_UP))));

        if (!activeGoals.isEmpty()) {
            Goal g = activeGoals.get(0);
            telemetryPrompt.append(String.format("- Active Goal: Target %s kg CO2e (%s)\n", g.getTargetValue(), g.getPeriodType()));
        }

        telemetryPrompt.append("\nReturn a JSON array containing exactly 5 personalized recommendations across different categories (Energy Optimization, Transportation, Waste Management, Water Conservation, Carbon Reduction, Sustainability Goals).\n");
        telemetryPrompt.append("Each item must have:\n");
        telemetryPrompt.append("- categoryName: string\n");
        telemetryPrompt.append("- title: string (concise, motivating)\n");
        telemetryPrompt.append("- problemIdentified: string (grounded in their actual numbers)\n");
        telemetryPrompt.append("- description: string (concrete action)\n");
        telemetryPrompt.append("- estimatedCo2eSavingsKg: number (realistic estimate, e.g. 5 to 30)\n");
        telemetryPrompt.append("- difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD'\n");
        telemetryPrompt.append("- priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW'\n");
        telemetryPrompt.append("- timeframe: string (e.g. '1-2 days', 'This week', '1 month')\n");
        telemetryPrompt.append("Respond ONLY with valid raw JSON array. Do not enclose in markdown code fences.\n");

        Map<String, Object> part = Map.of("text", telemetryPrompt.toString());
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestPayload = Map.of("contents", List.of(content));

        String requestBody = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(geminiEndpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API error code: " + response.statusCode());
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        JsonNode candidates = rootNode.path("candidates");
        if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("No candidates returned from Gemini");
        }

        String rawContent = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        // Clean markdown backticks if present
        String jsonClean = rawContent.replaceAll("^```json\\s*", "").replaceAll("```\\s*$", "").trim();

        JsonNode arrayNode = objectMapper.readTree(jsonClean);
        if (!arrayNode.isArray()) {
            throw new RuntimeException("Gemini output was not a JSON array");
        }

        List<Recommendation> result = new ArrayList<>();
        short priority = 1;

        for (JsonNode item : arrayNode) {
            Recommendation rec = new Recommendation();
            rec.setUserId(userId);
            rec.setCategoryName(item.path("categoryName").asText("Carbon Reduction"));
            rec.setTitle(item.path("title").asText("Personalized Sustainability Action"));
            rec.setProblemIdentified(item.path("problemIdentified").asText("Identified high emissions from recent data."));
            rec.setDescription(item.path("description").asText("Implement recommended low-carbon measures."));
            rec.setEstimatedCo2eSavingsKg(BigDecimal.valueOf(item.path("estimatedCo2eSavingsKg").asDouble(10.0)).setScale(2, RoundingMode.HALF_UP));
            rec.setDifficultyLevel(item.path("difficultyLevel").asText("MEDIUM"));
            rec.setPriorityLevel(item.path("priorityLevel").asText("MEDIUM"));
            rec.setTimeframe(item.path("timeframe").asText("This week"));
            rec.setPriority(priority++);
            rec.setIsAiGenerated(true);
            rec.setAiModel("Gemini 1.5 Flash");
            result.add(rec);
        }

        return result;
    }
}
