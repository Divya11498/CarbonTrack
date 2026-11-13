package com.carbontrack.backend.service;

import com.carbontrack.backend.config.CacheConfig;
import com.carbontrack.backend.entity.*;
import com.carbontrack.backend.repository.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ActivityLogRepository activityLogRepository;
    private final UserProfileRepository userProfileRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final ActivityTypeRepository typeRepository;
    private final GoalRepository goalRepository;

    public AnalyticsService(
            ActivityLogRepository activityLogRepository,
            UserProfileRepository userProfileRepository,
            ActivityCategoryRepository categoryRepository,
            ActivityTypeRepository typeRepository,
            GoalRepository goalRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userProfileRepository = userProfileRepository;
        this.categoryRepository = categoryRepository;
        this.typeRepository = typeRepository;
        this.goalRepository = goalRepository;
    }

    @Cacheable(
            value = CacheConfig.CACHE_ANALYTICS_SUMMARY,
            key = "#userId + ':' + (#period == null ? 'this_month' : #period) + ':' + (#startDate == null ? '' : #startDate) + ':' + (#endDate == null ? '' : #endDate)"
    )
    public Map<String, Object> getSummary(Long userId, String period, String startDate, String endDate) {
        LocalDate[] range = resolveDateRange(period, startDate, endDate);
        LocalDate start = range[0];
        LocalDate end = range[1];
        long spanDays = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
        LocalDate prevEnd = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(spanDays - 1);

        List<ActivityLog> allLogs = activityLogRepository.findByUserId(userId);
        List<ActivityLog> currentLogs = filterByRange(allLogs, start, end);
        List<ActivityLog> prevLogs = filterByRange(allLogs, prevStart, prevEnd);

        BigDecimal totalCo2e = sumCo2(currentLogs);
        BigDecimal prevCo2e = sumCo2(prevLogs);

        // Current vs previous 7-day window regardless of overall period filter
        LocalDate today = LocalDate.now();
        LocalDate cwStart = today.minusDays(6);
        LocalDate pwStart = today.minusDays(13);
        LocalDate pwEnd = today.minusDays(7);
        BigDecimal currentWeekCo2e = sumCo2(filterByRange(allLogs, cwStart, today));
        BigDecimal previousWeekCo2e = sumCo2(filterByRange(allLogs, pwStart, pwEnd));

        Map<Short, ActivityCategory> catMap = categoryMap();
        Map<Short, ActivityType> typeMap = typeMap();

        Map<String, BigDecimal> categoryTotals = computeCategoryTotals(currentLogs, catMap);
        List<Map<String, Object>> categoryBreakdown = buildCategoryBreakdown(categoryTotals, totalCo2e);

        List<Map<String, Object>> topContributors = currentLogs.stream()
                .sorted((a, b) -> safeCo2(b).compareTo(safeCo2(a)))
                .limit(5)
                .map(log -> mapActivitySummary(log, catMap, typeMap))
                .toList();

        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        BigDecimal monthlyTarget = profile != null && profile.getMonthlyTargetKgco2e() != null
                ? profile.getMonthlyTargetKgco2e()
                : new BigDecimal("200.00");

        double reduced = Math.max(0.0, monthlyTarget.doubleValue() - totalCo2e.doubleValue());
        int score = calculateSustainabilityScore(totalCo2e.doubleValue(), monthlyTarget.doubleValue(), currentLogs.size());

        Double deltaPercent = computeDeltaPercent(totalCo2e, prevCo2e);
        Double weeklyDeltaPercent = computeDeltaPercent(currentWeekCo2e, previousWeekCo2e);

        // Active goal count & achieved goal count
        List<Goal> userGoals = goalRepository.findByUserId(userId);
        long achievedCount = userGoals.stream()
                .filter(g -> "ACHIEVED".equalsIgnoreCase(g.getStatus()) || "COMPLETED".equalsIgnoreCase(g.getStatus()))
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("period", period == null ? "this_month" : period);
        summary.put("startDate", start.toString());
        summary.put("endDate", end.toString());
        summary.put("totalCo2eKg", totalCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("previousPeriodCo2eKg", prevCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("periodDeltaPercent", deltaPercent);
        summary.put("currentWeekCo2eKg", currentWeekCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("previousWeekCo2eKg", previousWeekCo2e.setScale(2, RoundingMode.HALF_UP));
        summary.put("weeklyDeltaPercent", weeklyDeltaPercent);
        summary.put("activityCount", currentLogs.size());
        summary.put("totalAllTimeActivities", allLogs.size());
        summary.put("categoryBreakdown", categoryBreakdown);
        summary.put("topContributors", topContributors);
        summary.put("monthlyTargetKg", monthlyTarget);
        summary.put("totalReducedKg", BigDecimal.valueOf(reduced).setScale(2, RoundingMode.HALF_UP));
        summary.put("dailyAverageKg", BigDecimal.valueOf(totalCo2e.doubleValue() / spanDays).setScale(2, RoundingMode.HALF_UP));
        summary.put("sustainabilityScore", score);
        summary.put("achievedGoalsCount", achievedCount);
        summary.put("bestCategory", findLowestCategory(categoryTotals));
        return summary;
    }

    @Cacheable(
            value = CacheConfig.CACHE_ANALYTICS_TRENDS,
            key = "#userId + ':' + (#period == null ? '30d' : #period) + ':' + (#startDate == null ? '' : #startDate) + ':' + (#endDate == null ? '' : #endDate)"
    )
    public Map<String, Object> getTrends(Long userId, String period, String startDate, String endDate) {
        LocalDate[] range = resolveDateRange(period, startDate, endDate);
        LocalDate start = range[0];
        LocalDate end = range[1];
        long spanDays = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
        LocalDate prevEnd = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(spanDays - 1);

        List<ActivityLog> allLogs = activityLogRepository.findByUserId(userId);
        List<ActivityLog> filtered = filterByRange(allLogs, start, end);
        List<ActivityLog> prevFiltered = filterByRange(allLogs, prevStart, prevEnd);

        BigDecimal totalCo2e = sumCo2(filtered);
        BigDecimal prevCo2e = sumCo2(prevFiltered);

        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        double monthlyTarget = profile != null && profile.getMonthlyTargetKgco2e() != null
                ? profile.getMonthlyTargetKgco2e().doubleValue()
                : 200.0;
        double dailyBudget = monthlyTarget / Math.max(1, start.lengthOfMonth());

        Map<LocalDate, List<ActivityLog>> byDate = filtered.stream()
                .filter(a -> a.getLogDate() != null)
                .collect(Collectors.groupingBy(ActivityLog::getLogDate));
        Map<LocalDate, List<ActivityLog>> prevByDate = prevFiltered.stream()
                .filter(a -> a.getLogDate() != null)
                .collect(Collectors.groupingBy(ActivityLog::getLogDate));

        List<Map<String, Object>> trendPoints = new ArrayList<>();
        double cumulative = 0.0;
        double targetCumulative = 0.0;
        DateTimeFormatter fmt = spanDays > 60 ? DateTimeFormatter.ofPattern("MMM dd") : DateTimeFormatter.ofPattern("MM-dd");

        long dayIndex = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            List<ActivityLog> dayLogs = byDate.getOrDefault(d, List.of());
            BigDecimal daySum = sumCo2(dayLogs);
            cumulative += daySum.doubleValue();
            targetCumulative += dailyBudget;

            LocalDate prevD = prevStart.plusDays(dayIndex++);
            List<ActivityLog> prevDayLogs = prevByDate.getOrDefault(prevD, List.of());
            BigDecimal prevDaySum = sumCo2(prevDayLogs);

            Map<String, Object> pt = new HashMap<>();
            pt.put("date", d.toString());
            pt.put("label", d.format(fmt));
            pt.put("co2e", daySum.setScale(2, RoundingMode.HALF_UP));
            pt.put("prevCo2e", prevDaySum.setScale(2, RoundingMode.HALF_UP));
            pt.put("cumulativeCo2e", BigDecimal.valueOf(cumulative).setScale(2, RoundingMode.HALF_UP));
            pt.put("targetCumulativeCo2e", BigDecimal.valueOf(targetCumulative).setScale(2, RoundingMode.HALF_UP));
            pt.put("count", dayLogs.size());
            trendPoints.add(pt);
        }

        // Weekly comparison: Last 7 days vs 7 days prior
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> weeklyComparison = new ArrayList<>();
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("EEE");
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate currDay = today.minusDays(offset);
            LocalDate prevDay = currDay.minusDays(7);
            BigDecimal currVal = sumCo2(filterByRange(allLogs, currDay, currDay));
            BigDecimal prevVal = sumCo2(filterByRange(allLogs, prevDay, prevDay));

            Map<String, Object> wRow = new HashMap<>();
            wRow.put("day", currDay.format(dayFmt));
            wRow.put("date", currDay.toString());
            wRow.put("currentWeek", currVal.setScale(2, RoundingMode.HALF_UP));
            wRow.put("previousWeek", prevVal.setScale(2, RoundingMode.HALF_UP));
            weeklyComparison.add(wRow);
        }

        Map<Short, ActivityCategory> catMap = categoryMap();
        Map<Short, ActivityType> typeMap = typeMap();

        // Month-over-Month & Historical 6 months with category breakdown
        List<Map<String, Object>> historicalEmissions = new ArrayList<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDate currentMonthStart = today.withDayOfMonth(1);
        for (int i = 5; i >= 0; i--) {
            LocalDate mStart = currentMonthStart.minusMonths(i);
            LocalDate mEnd = mStart.plusMonths(1).minusDays(1);
            List<ActivityLog> mLogs = filterByRange(allLogs, mStart, mEnd);
            BigDecimal mSum = sumCo2(mLogs);
            LocalDate lastYearStart = mStart.minusYears(1);
            LocalDate lastYearEnd = lastYearStart.plusMonths(1).minusDays(1);
            BigDecimal prevYearSum = sumCo2(filterByRange(allLogs, lastYearStart, lastYearEnd));

            Map<String, Object> mRow = new HashMap<>();
            mRow.put("month", mStart.format(monthFmt));
            mRow.put("co2e", mSum.setScale(2, RoundingMode.HALF_UP));
            mRow.put("previousYearCo2e", prevYearSum.setScale(2, RoundingMode.HALF_UP));
            mRow.put("target", BigDecimal.valueOf(monthlyTarget).setScale(2, RoundingMode.HALF_UP));
            mRow.put("activities", mLogs.size());

            // Add category breakdown per month for stacked bar visualization
            mRow.put("Transport", BigDecimal.ZERO);
            mRow.put("Electricity", BigDecimal.ZERO);
            mRow.put("Food", BigDecimal.ZERO);
            mRow.put("Shopping", BigDecimal.ZERO);
            mRow.put("Waste", BigDecimal.ZERO);
            mRow.put("Other", BigDecimal.ZERO);

            for (ActivityLog a : mLogs) {
                ActivityCategory cat = catMap.get(a.getCategoryId());
                String rawName = cat != null && cat.getName() != null ? cat.getName() : "Other";
                String cKey = Character.toUpperCase(rawName.charAt(0)) + rawName.substring(1).toLowerCase();
                if (!mRow.containsKey(cKey)) {
                    cKey = "Other";
                }
                BigDecimal cur = (BigDecimal) mRow.get(cKey);
                BigDecimal addVal = a.getCo2eKg() != null ? a.getCo2eKg() : BigDecimal.ZERO;
                mRow.put(cKey, cur.add(addVal).setScale(2, RoundingMode.HALF_UP));
            }

            historicalEmissions.add(mRow);
        }
        Map<String, BigDecimal> categoryTotals = computeCategoryTotals(filtered, catMap);
        List<Map<String, Object>> categorySeries = buildCategoryBreakdown(categoryTotals, totalCo2e);

        List<Map<String, Object>> topActivities = filtered.stream()
                .sorted((a, b) -> safeCo2(b).compareTo(safeCo2(a)))
                .limit(8)
                .map(log -> mapActivitySummary(log, catMap, typeMap))
                .toList();

        Map<String, Object> resp = new HashMap<>();
        resp.put("period", period == null ? "30d" : period);
        resp.put("startDate", start.toString());
        resp.put("endDate", end.toString());
        resp.put("trend", trendPoints);
        resp.put("weeklyComparison", weeklyComparison);
        resp.put("historicalEmissions", historicalEmissions);
        resp.put("categorySeries", categorySeries);
        resp.put("topActivities", topActivities);
        resp.put("totalCo2eKg", totalCo2e.setScale(2, RoundingMode.HALF_UP));
        resp.put("previousPeriodCo2eKg", prevCo2e.setScale(2, RoundingMode.HALF_UP));
        resp.put("deltaPercent", computeDeltaPercent(totalCo2e, prevCo2e));
        resp.put("activityCount", filtered.size());
        resp.put("monthlyTargetKg", BigDecimal.valueOf(monthlyTarget).setScale(2, RoundingMode.HALF_UP));
        return resp;
    }

    @Cacheable(value = CacheConfig.CACHE_ANALYTICS_BENCHMARKS, key = "#userId")
    public Map<String, Object> getBenchmarks(Long userId) {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        List<ActivityLog> allLogs = activityLogRepository.findAll();

        Map<Long, BigDecimal> userTotals = new HashMap<>();
        for (ActivityLog log : allLogs) {
            if (log.getLogDate() != null && !log.getLogDate().isBefore(monthStart)) {
                userTotals.merge(log.getUserId(), safeCo2(log), BigDecimal::add);
            }
        }

        BigDecimal userTotal = userTotals.getOrDefault(userId, BigDecimal.ZERO);

        BigDecimal communityAvg = userTotals.isEmpty()
                ? BigDecimal.ZERO
                : userTotals.values().stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(userTotals.size()), 2, RoundingMode.HALF_UP);

        BigDecimal globalTargetAvg = new BigDecimal("185.00");

        int rank = 1;
        long totalParticipants = userTotals.size();
        for (BigDecimal val : userTotals.values()) {
            if (val.compareTo(userTotal) < 0) {
                rank++;
            }
        }

        int percentileTop = totalParticipants <= 1
                ? 50
                : (int) Math.max(1, Math.min(100, Math.round((rank * 100.0) / totalParticipants)));

        Map<String, Object> result = new HashMap<>();
        result.put("userMonthlyCo2e", userTotal.setScale(2, RoundingMode.HALF_UP));
        result.put("communityAverageCo2e", communityAvg);
        result.put("recommendedTargetCo2e", globalTargetAvg);
        result.put("percentileRank", percentileTop);
        result.put("totalParticipants", totalParticipants);
        result.put("comparisonStatus",
                communityAvg.compareTo(BigDecimal.ZERO) == 0
                        ? "NO_COMMUNITY_DATA"
                        : (userTotal.compareTo(communityAvg) <= 0 ? "BETTER_THAN_AVERAGE" : "ABOVE_AVERAGE"));
        return result;
    }

    @Cacheable(value = CacheConfig.CACHE_ANALYTICS_BENCHMARKS, key = "'peer:' + #userId")
    public Map<String, Object> getPeerBenchmarking(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        List<ActivityLog> allLogs = activityLogRepository.findAll();

        Map<Long, List<ActivityLog>> logsByUserThisMonth = new HashMap<>();
        Map<Long, BigDecimal> userMonthlyTotals = new HashMap<>();

        for (ActivityLog log : allLogs) {
            if (log.getLogDate() != null && !log.getLogDate().isBefore(monthStart) && !log.getLogDate().isAfter(today)) {
                logsByUserThisMonth.computeIfAbsent(log.getUserId(), k -> new ArrayList<>()).add(log);
                userMonthlyTotals.merge(log.getUserId(), safeCo2(log), BigDecimal::add);
            }
        }

        int totalParticipants = userMonthlyTotals.size();
        if (totalParticipants < 2) {
            Map<String, Object> emptyResp = new HashMap<>();
            emptyResp.put("insufficientData", true);
            emptyResp.put("totalParticipants", totalParticipants);
            emptyResp.put("message", "Peer benchmarking will become available as more users join and contribute activity data.");
            BigDecimal userTotal = userMonthlyTotals.getOrDefault(userId, BigDecimal.ZERO);
            emptyResp.put("userTotalFootprintKg", userTotal.setScale(2, RoundingMode.HALF_UP));
            emptyResp.put("platformAverageFootprintKg", userTotal.setScale(2, RoundingMode.HALF_UP));
            emptyResp.put("userPercentile", 50);
            emptyResp.put("categoryComparison", List.of());
            emptyResp.put("monthlyComparison", List.of());
            return emptyResp;
        }

        BigDecimal userTotal = userMonthlyTotals.getOrDefault(userId, BigDecimal.ZERO);

        BigDecimal platformSum = userMonthlyTotals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal platformAvg = platformSum.divide(BigDecimal.valueOf(totalParticipants), 2, RoundingMode.HALF_UP);

        long higherEmissionsCount = userMonthlyTotals.values().stream().filter(val -> val.compareTo(userTotal) > 0).count();
        long equalEmissionsCount = userMonthlyTotals.values().stream().filter(val -> val.compareTo(userTotal) == 0).count();
        int percentile = (int) Math.round(((higherEmissionsCount + (equalEmissionsCount * 0.5)) / (double) totalParticipants) * 100.0);
        percentile = Math.max(1, Math.min(99, percentile));

        String percentileMessage = String.format("Your carbon footprint is lower than %d%% of active users this month.", percentile);

        Map<Short, ActivityCategory> catMap = categoryMap();
        Map<String, BigDecimal> userCategoryTotals = new HashMap<>();
        Map<String, BigDecimal> platformCategorySums = new HashMap<>();

        for (Map.Entry<Long, List<ActivityLog>> entry : logsByUserThisMonth.entrySet()) {
            Long uid = entry.getKey();
            boolean isCurrentUser = uid.equals(userId);
            Map<String, BigDecimal> thisUserCatTotals = new HashMap<>();
            for (ActivityLog l : entry.getValue()) {
                ActivityCategory c = catMap.get(l.getCategoryId());
                String cName = c != null ? capitalize(c.getName()) : "Other";
                BigDecimal co2 = safeCo2(l);
                thisUserCatTotals.merge(cName, co2, BigDecimal::add);
                if (isCurrentUser) {
                    userCategoryTotals.merge(cName, co2, BigDecimal::add);
                }
            }
            for (Map.Entry<String, BigDecimal> catEntry : thisUserCatTotals.entrySet()) {
                platformCategorySums.merge(catEntry.getKey(), catEntry.getValue(), BigDecimal::add);
            }
        }

        List<String> standardCategories = List.of("Transport", "Electricity", "Food", "Shopping", "Waste");
        List<Map<String, Object>> categoryComparison = new ArrayList<>();
        String highestEmissionCategory = "None";
        BigDecimal maxCatEmissions = BigDecimal.ZERO;

        for (String cat : standardCategories) {
            BigDecimal uKg = userCategoryTotals.getOrDefault(cat, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal pSum = platformCategorySums.getOrDefault(cat, BigDecimal.ZERO);
            BigDecimal pAvg = pSum.divide(BigDecimal.valueOf(totalParticipants), 2, RoundingMode.HALF_UP);

            if (uKg.compareTo(maxCatEmissions) > 0) {
                maxCatEmissions = uKg;
                highestEmissionCategory = cat;
            }

            Double diffPct = null;
            if (pAvg.compareTo(BigDecimal.ZERO) > 0) {
                diffPct = BigDecimal.valueOf(((uKg.doubleValue() - pAvg.doubleValue()) / pAvg.doubleValue()) * 100.0)
                        .setScale(1, RoundingMode.HALF_UP).doubleValue();
            }

            Map<String, Object> catMapItem = new HashMap<>();
            catMapItem.put("category", cat);
            catMapItem.put("userKg", uKg);
            catMapItem.put("platformAvgKg", pAvg);
            catMapItem.put("diffPercent", diffPct);
            catMapItem.put("status", uKg.compareTo(pAvg) <= 0 ? "LOWER" : "HIGHER");
            categoryComparison.add(catMapItem);
        }

        List<Map<String, Object>> monthlyComparison = new ArrayList<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        LocalDate currentMonthStart = today.withDayOfMonth(1);

        for (int i = 5; i >= 0; i--) {
            LocalDate mStart = currentMonthStart.minusMonths(i);
            LocalDate mEnd = mStart.plusMonths(1).minusDays(1);

            List<ActivityLog> mLogs = allLogs.stream()
                    .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(mStart) && !l.getLogDate().isAfter(mEnd))
                    .toList();

            Map<Long, BigDecimal> mUserSums = new HashMap<>();
            for (ActivityLog l : mLogs) {
                mUserSums.merge(l.getUserId(), safeCo2(l), BigDecimal::add);
            }

            BigDecimal mUserKg = mUserSums.getOrDefault(userId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal mPlatformAvg = mUserSums.isEmpty() ? BigDecimal.ZERO :
                    mUserSums.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(Math.max(1, mUserSums.size())), 2, RoundingMode.HALF_UP);

            Map<String, Object> mPoint = new HashMap<>();
            mPoint.put("month", mStart.format(monthFmt));
            mPoint.put("userKg", mUserKg);
            mPoint.put("platformAvgKg", mPlatformAvg);
            monthlyComparison.add(mPoint);
        }

        Double overallDiffPct = null;
        if (platformAvg.compareTo(BigDecimal.ZERO) > 0) {
            overallDiffPct = BigDecimal.valueOf(((userTotal.doubleValue() - platformAvg.doubleValue()) / platformAvg.doubleValue()) * 100.0)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("insufficientData", false);
        result.put("totalParticipants", totalParticipants);
        result.put("userTotalFootprintKg", userTotal.setScale(2, RoundingMode.HALF_UP));
        result.put("platformAverageFootprintKg", platformAvg);
        result.put("userPercentile", percentile);
        result.put("percentileMessage", percentileMessage);
        result.put("highestEmissionCategory", highestEmissionCategory);
        result.put("categoryComparison", categoryComparison);
        result.put("monthlyComparison", monthlyComparison);
        result.put("reductionPerformance", overallDiffPct);
        result.put("status", userTotal.compareTo(platformAvg) <= 0 ? "BETTER_THAN_AVERAGE" : "ABOVE_AVERAGE");

        return result;
    }

    public LocalDate[] resolveDateRange(String period, String startDateStr, String endDateStr) {
        LocalDate today = LocalDate.now();
        String p = period == null ? "30d" : period.trim().toLowerCase();
        return switch (p) {
            case "today" -> new LocalDate[]{today, today};
            case "week", "7d" -> new LocalDate[]{today.minusDays(6), today};
            case "this_month", "month" -> new LocalDate[]{today.withDayOfMonth(1), today};
            case "prev_month" -> {
                LocalDate prevStart = today.withDayOfMonth(1).minusMonths(1);
                LocalDate prevEnd = prevStart.withDayOfMonth(prevStart.lengthOfMonth());
                yield new LocalDate[]{prevStart, prevEnd};
            }
            case "30d" -> new LocalDate[]{today.minusDays(29), today};
            case "year", "365d" -> new LocalDate[]{today.withDayOfYear(1), today};
            case "custom" -> {
                LocalDate s = parseDateOrDefault(startDateStr, today.minusDays(29));
                LocalDate e = parseDateOrDefault(endDateStr, today);
                if (s.isAfter(e)) {
                    LocalDate tmp = s;
                    s = e;
                    e = tmp;
                }
                yield new LocalDate[]{s, e};
            }
            default -> new LocalDate[]{today.minusDays(29), today};
        };
    }

    private LocalDate parseDateOrDefault(String value, LocalDate fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ex) {
            return fallback;
        }
    }

    private List<ActivityLog> filterByRange(List<ActivityLog> logs, LocalDate start, LocalDate end) {
        return logs.stream()
                .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(start) && !l.getLogDate().isAfter(end))
                .toList();
    }

    private BigDecimal sumCo2(List<ActivityLog> logs) {
        return logs.stream().map(this::safeCo2).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal safeCo2(ActivityLog log) {
        return log.getCo2eKg() != null ? log.getCo2eKg() : BigDecimal.ZERO;
    }

    private Double computeDeltaPercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) == 0 ? 0.0 : null;
        }
        return BigDecimal.valueOf(((current.doubleValue() - previous.doubleValue()) / previous.doubleValue()) * 100.0)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Map<Short, ActivityCategory> categoryMap() {
        return categoryRepository.findAll().stream()
                .collect(Collectors.toMap(ActivityCategory::getId, c -> c));
    }

    private Map<Short, ActivityType> typeMap() {
        return typeRepository.findAll().stream()
                .collect(Collectors.toMap(ActivityType::getId, t -> t));
    }

    private Map<String, BigDecimal> computeCategoryTotals(List<ActivityLog> logs, Map<Short, ActivityCategory> catMap) {
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        for (ActivityLog log : logs) {
            ActivityCategory c = catMap.get(log.getCategoryId());
            String name = c != null ? capitalize(c.getName()) : "Other";
            totals.merge(name, safeCo2(log), BigDecimal::add);
        }
        return totals;
    }

    private List<Map<String, Object>> buildCategoryBreakdown(Map<String, BigDecimal> categoryTotals, BigDecimal totalCo2e) {
        double totalD = totalCo2e.doubleValue();
        return categoryTotals.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(entry -> {
                    double val = entry.getValue().doubleValue();
                    double pct = totalD > 0 ? Math.round((val / totalD) * 1000.0) / 10.0 : 0.0;
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue().setScale(2, RoundingMode.HALF_UP));
                    item.put("percent", pct);
                    return item;
                })
                .toList();
    }

    private Map<String, Object> mapActivitySummary(
            ActivityLog log,
            Map<Short, ActivityCategory> catMap,
            Map<Short, ActivityType> typeMap) {
        ActivityType t = typeMap.get(log.getActivityTypeId());
        ActivityCategory c = catMap.get(log.getCategoryId());
        String rawName = t != null ? t.getName() : "Activity";
        Map<String, Object> m = new HashMap<>();
        m.put("id", log.getId());
        m.put("name", formatActivityLabel(rawName));
        m.put("category", c != null ? capitalize(c.getName()) : "Other");
        m.put("co2e", safeCo2(log).setScale(2, RoundingMode.HALF_UP));
        m.put("quantity", log.getQuantity());
        m.put("unit", log.getUnit());
        m.put("date", log.getLogDate() != null ? log.getLogDate().toString() : null);
        return m;
    }

    private String findLowestCategory(Map<String, BigDecimal> totals) {
        return totals.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General");
    }

    private int calculateSustainabilityScore(double emissions, double target, int activityCount) {
        if (activityCount == 0) return 50;
        if (target <= 0) target = 200.0;
        double ratio = emissions / target;
        int raw = (int) Math.round(100.0 - (ratio * 45.0));
        return Math.max(10, Math.min(100, raw));
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return "Other";
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    private String formatActivityLabel(String name) {
        if (name == null) return "Activity";
        return Arrays.stream(name.split("_"))
                .filter(p -> !p.isEmpty())
                .map(this::capitalize)
                .collect(Collectors.joining(" "));
    }
}
