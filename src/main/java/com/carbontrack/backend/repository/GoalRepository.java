
package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByUserId(Long userId);

    List<Goal> findByUserIdAndStatus(Long userId, String status);

    Optional<Goal> findByIdAndUserId(Long id, Long userId);
}
