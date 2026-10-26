
package com.carbontrack.backend.service;

import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.ActivityLogRepository.CategoryBenchmarkRow;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BenchmarkingService {

    private static final int MINIMUM_COMPARISON_USERS = 5;

    private final ActivityLogRepository activityLogRepository;

    public BenchmarkingService(
            ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBenchmarks(Long userId) {

        LocalDate endExclusive = LocalDate.now().plusDays(1);
        LocalDate startDate = endExclusive.minusDays(30);
        LocalDate endDate = endExclusive.minusDays(1);

        List<CategoryBenchmarkRow> rows =
                activityLogRepository.findCategoryBenchmarks(
                        userId,
                        startDate,
                        endExclusive
                );

        List<Map<String, Object>> categories = new ArrayList<>();

        for (CategoryBenchmarkRow row : rows) {

            long comparisonCount =
                    row.getComparisonUserCount() == null
                            ? 0L
                            : row.getComparisonUserCount();

            long usersBelow =
                    row.getUsersBelow() == null
                            ? 0L
                            : row.getUsersBelow();

            boolean comparisonReliable =
                    comparisonCount >= MINIMUM_COMPARISON_USERS;

            Map<String, Object> category = new LinkedHashMap<>();

            category.put("categoryId", row.getCategoryId());
            category.put("categoryName", row.getCategoryName());
            category.put(
                    "userEmissionsKgCo2e",
                    row.getUserEmissionsKgCo2e()
            );
            category.put("comparisonReliable", comparisonReliable);
            category.put("minimumComparisonUsers",
                    MINIMUM_COMPARISON_USERS);

            if (comparisonReliable) {

                BigDecimal percentile =
                        BigDecimal.valueOf(usersBelow)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(
                                        BigDecimal.valueOf(comparisonCount),
                                        2,
                                        RoundingMode.HALF_UP
                                );

                category.put(
                        "platformAverageKgCo2e",
                        row.getPlatformAverageKgCo2e()
                );
                category.put(
                        "usersWithLowerEmissions",
                        usersBelow
                );
                category.put(
                        "comparisonUserCount",
                        comparisonCount
                );
                category.put(
                        "percentileDefinition",
                        "Percentage of comparison users with lower emissions"
                );
                category.put("percentile", percentile);

            } else {

                category.put("platformAverageKgCo2e", null);
                category.put("usersWithLowerEmissions", null);
                category.put("comparisonUserCount", comparisonCount);
                category.put("percentileDefinition", null);
                category.put("percentile", null);
                category.put(
                        "comparisonMessage",
                        "Not enough comparison users to display reliable, privacy-conscious statistics."
                );
            }

            categories.add(category);
        }

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("period", "LAST_30_DAYS");
        response.put("startDate", startDate);
        response.put("endDate", endDate);
        response.put("minimumComparisonUsers",
                MINIMUM_COMPARISON_USERS);
        response.put("categories", categories);

        return response;
    }
}
