package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByUserIdAndStatusInOrderByPriorityAscGeneratedAtDesc(
            Long userId, List<String> statuses);

    List<Recommendation> findByUserIdAndStatusOrderByPriorityAsc(Long userId, String status);

    List<Recommendation> findByUserIdOrderByGeneratedAtDesc(Long userId);

    long countByUserIdAndStatus(Long userId, String status);

    @Query("SELECT r FROM Recommendation r WHERE r.userId = :userId AND r.generatedAt >= :since ORDER BY r.priority ASC")
    List<Recommendation> findRecentByUserId(@Param("userId") Long userId, @Param("since") OffsetDateTime since);

    @Query("SELECT COALESCE(SUM(r.actualCo2eSavingsKg), 0) FROM Recommendation r WHERE r.userId = :userId AND r.status = 'COMPLETED'")
    BigDecimal sumActualSavingsByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(r.estimatedCo2eSavingsKg), 0) FROM Recommendation r WHERE r.userId = :userId AND r.status IN ('ACTIVE', 'IN_PROGRESS')")
    BigDecimal sumPotentialSavingsByUserId(@Param("userId") Long userId);
}
