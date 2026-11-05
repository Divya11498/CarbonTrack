package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserId(Long userId);

    List<ActivityLog> findByUserIdOrderByLogDateDesc(Long userId);

    List<ActivityLog> findByUserIdAndLogDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    List<ActivityLog> findByOrganizationId(Long organizationId);

    @Query("SELECT a FROM ActivityLog a WHERE a.userId = :userId AND a.logDate >= :sinceDate ORDER BY a.logDate DESC")
    List<ActivityLog> findRecentByUserId(@Param("userId") Long userId, @Param("sinceDate") LocalDate sinceDate);
}
