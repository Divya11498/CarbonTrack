
package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.ActivityLog;
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
}
