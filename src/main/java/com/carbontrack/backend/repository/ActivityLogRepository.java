
package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserId(Long userId);

    @Query("""
        SELECT COALESCE(SUM(a.co2eKg), 0)
        FROM ActivityLog a
        WHERE a.userId = :userId
          AND a.logDate >= :startDate
          AND a.logDate < :endDate
        """)
    BigDecimal sumEmissionsByUserAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    interface ActivityEmissionSummary {
        Short getActivityTypeId();

        BigDecimal getTotalCo2eKg();

        Long getActivityCount();
    }

    @Query("""
        SELECT a.activityTypeId AS activityTypeId,
               SUM(a.co2eKg) AS totalCo2eKg,
               COUNT(a.id) AS activityCount
        FROM ActivityLog a
        WHERE a.userId = :userId
          AND a.logDate >= :startDate
          AND a.logDate < :endDate
        GROUP BY a.activityTypeId
        ORDER BY SUM(a.co2eKg) DESC
        """)
    List<ActivityEmissionSummary> findTopEmissionActivityTypes(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    interface CategoryBenchmarkRow {
        Short getCategoryId();

        String getCategoryName();

        BigDecimal getUserEmissionsKgCo2e();

        BigDecimal getPlatformAverageKgCo2e();

        Long getUsersBelow();

        Long getUsersTied();

        Long getComparisonUserCount();
    }

    @Query(value = """
        WITH user_category_totals AS (
            SELECT
                user_id,
                category_id,
                SUM(co2e_kg) AS total_emissions
            FROM activity_logs
            WHERE log_date >= :startDate
              AND log_date < :endDate
              AND category_id IS NOT NULL
            GROUP BY user_id, category_id
        ),
        comparison_stats AS (
            SELECT
                category_id,
                AVG(total_emissions) AS platform_average
            FROM user_category_totals
            WHERE user_id <> :userId
            GROUP BY category_id
        )
        SELECT
            mine.category_id AS "categoryId",
            cat.name AS "categoryName",
            mine.total_emissions AS "userEmissionsKgCo2e",
            stats.platform_average AS "platformAverageKgCo2e",
            COUNT(other.user_id) FILTER (
                WHERE other.total_emissions < mine.total_emissions
            ) AS "usersBelow",
            COUNT(other.user_id) FILTER (
                WHERE other.total_emissions = mine.total_emissions
            ) AS "usersTied",
            COUNT(other.user_id) AS "comparisonUserCount"
        FROM user_category_totals mine
        JOIN comparison_stats stats
          ON stats.category_id = mine.category_id
        JOIN activity_categories cat
          ON cat.id = mine.category_id
        LEFT JOIN user_category_totals other
          ON other.category_id = mine.category_id
         AND other.user_id <> :userId
        WHERE mine.user_id = :userId
        GROUP BY
            mine.category_id,
            cat.name,
            mine.total_emissions,
            stats.platform_average
        ORDER BY mine.category_id
        """, nativeQuery = true)
    List<CategoryBenchmarkRow> findCategoryBenchmarks(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
