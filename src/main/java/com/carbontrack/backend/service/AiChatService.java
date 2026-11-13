package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.EmissionFactor;
import com.carbontrack.backend.entity.Goal;
import com.carbontrack.backend.entity.Organization;
import com.carbontrack.backend.entity.OrganizationMember;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.EmissionFactorRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.OrganizationMemberRepository;
import com.carbontrack.backend.repository.OrganizationRepository;
import com.carbontrack.backend.repository.RecommendationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;
    private final RecommendationRepository recommendationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final EmissionFactorRepository emissionFactorRepository;
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

    public AiChatService(
            ActivityLogRepository activityLogRepository,
            GoalRepository goalRepository,
            RecommendationRepository recommendationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            OrganizationRepository organizationRepository,
            EmissionFactorRepository emissionFactorRepository) {
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
        this.recommendationRepository = recommendationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.organizationRepository = organizationRepository;
        this.emissionFactorRepository = emissionFactorRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
    }

    public Map<String, Object> processChat(
            User user,
            String message,
            String context,
            List<Map<String, String>> history) {

        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("User message cannot be empty.");
        }

        // Aggregate User Telemetry (past 30 days)
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<ActivityLog> activities = activityLogRepository.findByUserIdAndLogDateBetween(
                user.getId(), thirtyDaysAgo, LocalDate.now());

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

        // Top emission driver
        Map.Entry<Short, BigDecimal> topDriverEntry = activityTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        String topDriverName = topDriverEntry != null ?
                ACTIVITY_NAMES.getOrDefault(topDriverEntry.getKey(), "Daily Activities") : "General Consumption";
        BigDecimal topDriverCo2 = topDriverEntry != null ? topDriverEntry.getValue() : BigDecimal.ZERO;

        // Goals progress
        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
        String goalSummary = "No active reduction target set yet.";
        BigDecimal monthlyTarget = BigDecimal.ZERO;
        if (!activeGoals.isEmpty()) {
            Goal g = activeGoals.get(0);
            monthlyTarget = g.getTargetValue() != null ? g.getTargetValue() : BigDecimal.ZERO;
            goalSummary = String.format("%s kg CO₂e (%s)", monthlyTarget, g.getPeriodType());
        }

        // Savings & completed actions
        BigDecimal actualSavings = recommendationRepository.sumActualSavingsByUserId(user.getId());
        long completedActions = recommendationRepository.countByUserIdAndStatus(user.getId(), "COMPLETED");

        // Organization context
        String orgInfo = "Not affiliated with an organization.";
        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(user.getId());
        if (!memberships.isEmpty()) {
            OrganizationMember member = memberships.get(0);
            Organization org = organizationRepository.findById(member.getOrganizationId()).orElse(null);
            if (org != null) {
                orgInfo = String.format("%s (Role: %s, Department: %s)", org.getName(), member.getRole(), member.getDepartment());
            }
        }

        // If Gemini API Key is configured, execute real AI call
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                String reply = callGeminiChat(user, message, context, history, totalFootprint, categoryTotals,
                        topDriverName, topDriverCo2, goalSummary, monthlyTarget, actualSavings, completedActions, orgInfo);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("reply", reply);
                response.put("isConfigured", true);
                response.put("aiModel", "Gemini Flash Latest");
                response.put("timestamp", OffsetDateTime.now());
                return response;
            } catch (Exception e) {
                log.error("Gemini API call failed: {}", e.getMessage(), e);
                // Fall back gracefully with clear message
            }
        }

        // When no AI key is configured or API failed:
        // As explicitly required: clearly indicate configuration is required, do not pretend hardcoded response is AI.
        StringBuilder replyBuilder = new StringBuilder();
        replyBuilder.append("⚠️ **Gemini AI API Key Configuration Required**\n\n");
        replyBuilder.append("To receive live conversational AI answers, please configure `gemini.api.key` in your backend `application.properties` or set the `GEMINI_API_KEY` environment variable.\n\n");
        replyBuilder.append("**Your Current Live CarbonTrack Telemetry Summary:**\n");
        replyBuilder.append(String.format("• **30-Day Total Footprint:** %s kg CO₂e\n", totalFootprint.setScale(1, RoundingMode.HALF_UP)));
        replyBuilder.append(String.format("• **Primary Emission Driver:** %s (%s kg CO₂e)\n", topDriverName, topDriverCo2.setScale(1, RoundingMode.HALF_UP)));
        replyBuilder.append(String.format("• **Active Target:** %s\n", goalSummary));
        replyBuilder.append(String.format("• **Verified Carbon Saved:** %s kg CO₂e across %d completed actions\n",
                actualSavings.setScale(1, RoundingMode.HALF_UP), completedActions));
        replyBuilder.append(String.format("• **Organization:** %s\n\n", orgInfo));

        if (context != null && !context.isBlank()) {
            replyBuilder.append(String.format("**Regarding your recommendation (\"%s\"):**\n", context));
            replyBuilder.append("Take immediate action by tracking daily usage, switching to energy-efficient alternatives, and clicking 'Start Action' on the Recommendations dashboard.\n");
        } else {
            replyBuilder.append("*Once your GEMINI_API_KEY is configured, I can provide conversational recommendations, calculate custom reduction estimates, and answer complex questions.*");
        }

        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("reply", replyBuilder.toString());
        fallback.put("isConfigured", false);
        fallback.put("aiModel", "CarbonTrack Telemetry Engine");
        fallback.put("timestamp", OffsetDateTime.now());
        return fallback;
    }

    private String callGeminiChat(
            User user,
            String message,
            String context,
            List<Map<String, String>> history,
            BigDecimal totalFootprint,
            Map<String, BigDecimal> categoryTotals,
            String topDriverName,
            BigDecimal topDriverCo2,
            String goalSummary,
            BigDecimal monthlyTarget,
            BigDecimal actualSavings,
            long completedActions,
            String orgInfo) throws Exception {

        String geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" + geminiApiKey;

        // Build system prompt
        StringBuilder systemPrompt = new StringBuilder();
        systemPrompt.append("You are CarbonTrack AI, an encouraging, scientifically accurate, and actionable sustainability expert assistant inside the CarbonTrack platform.\n");
        systemPrompt.append("You help users analyze their carbon footprint, reduce emissions, save energy and transport costs, and achieve personal and team sustainability goals.\n\n");
        systemPrompt.append("AUTHENTICATED USER REAL-TIME TELEMETRY (PAST 30 DAYS):\n");
        systemPrompt.append(String.format("- User: %s\n", user.getDisplayName() != null ? user.getDisplayName() : "CarbonTrack User"));
        systemPrompt.append(String.format("- Total Emissions (30d): %s kg CO2e\n", totalFootprint.setScale(1, RoundingMode.HALF_UP)));
        systemPrompt.append(String.format("- Top Emission Driver: %s (%s kg CO2e)\n", topDriverName, topDriverCo2.setScale(1, RoundingMode.HALF_UP)));
        systemPrompt.append("- Category Breakdown:\n");
        categoryTotals.forEach((cat, co2) -> systemPrompt.append(String.format("  * %s: %s kg CO2e\n", cat, co2.setScale(1, RoundingMode.HALF_UP))));
        systemPrompt.append(String.format("- Active Goal / Budget: %s\n", goalSummary));
        systemPrompt.append(String.format("- Verified Carbon Saved To Date: %s kg CO2e\n", actualSavings.setScale(1, RoundingMode.HALF_UP)));
        systemPrompt.append(String.format("- Completed Sustainable Actions: %d\n", completedActions));
        systemPrompt.append(String.format("- Organization Affiliation: %s\n", orgInfo));
        systemPrompt.append("- Key Active Database Emission Factors (kg CO2e per unit):\n");
        emissionFactorRepository.findAll().stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()))
                .limit(16)
                .forEach(f -> {
                    String actLabel = ACTIVITY_NAMES.getOrDefault(f.getActivityTypeId(), "Activity #" + f.getActivityTypeId());
                    systemPrompt.append(String.format("  * %s: %s kg CO2e/%s\n", actLabel, f.getFactorValue(), f.getUnit()));
                });
        systemPrompt.append("\n");

        if (context != null && !context.isBlank()) {
            systemPrompt.append(String.format("RECOMMENDATION CONTEXT SELECTED BY USER:\n\"%s\"\n\n", context));
        }

        systemPrompt.append("INSTRUCTIONS:\n");
        systemPrompt.append("1. Answer the user's inquiry directly, referencing their real telemetry metrics when relevant.\n");
        systemPrompt.append("2. If user data is missing for an activity or category, state clearly that they have not logged data for it yet rather than inventing numbers.\n");
        systemPrompt.append("3. Provide realistic, concrete action steps with approximate kg CO2e savings estimates where appropriate.\n");
        systemPrompt.append("4. Format your reply with clean, readable markdown (bullet points, bold highlights, concise paragraphs).\n");
        systemPrompt.append("5. Maintain an inspiring, professional, and accessible tone.\n");

        // Construct contents payload
        List<Map<String, Object>> contents = new ArrayList<>();

        // Add previous conversation turns (up to 6)
        if (history != null && !history.isEmpty()) {
            int start = Math.max(0, history.size() - 6);
            for (int i = start; i < history.size(); i++) {
                Map<String, String> h = history.get(i);
                String role = "user".equalsIgnoreCase(h.get("role")) ? "user" : "model";
                String content = h.get("content");
                if (content != null && !content.isBlank()) {
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", content))
                    ));
                }
            }
        }

        // Current message with system context prepended
        String userTurnWithContext = systemPrompt + "\nUser Question: " + message;
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userTurnWithContext))
        ));

        Map<String, Object> requestPayload = Map.of(
                "contents", contents,
                "generationConfig", Map.of(
                        "temperature", 0.6,
                        "maxOutputTokens", 800
                )
        );

        String jsonBody = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(geminiEndpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(25))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        }

        log.warn("Gemini response returned status {}: {}", response.statusCode(), response.body());
        throw new RuntimeException("Gemini API returned error: " + response.statusCode());
    }
}
