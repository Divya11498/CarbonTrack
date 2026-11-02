
package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.GoalProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GoalProgressRepository
        extends JpaRepository<GoalProgress, Long> {

    List<GoalProgress> findByGoalIdOrderByPeriodStartDesc(Long goalId);

    Optional<GoalProgress> findByGoalIdAndPeriodStartAndPeriodEnd(
            Long goalId,
            LocalDate periodStart,
            LocalDate periodEnd
    );
}
