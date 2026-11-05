package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityTypeRepository extends JpaRepository<ActivityType, Short> {
    List<ActivityType> findByIsActiveTrue();
    List<ActivityType> findByCategoryIdAndIsActiveTrue(Short categoryId);
}
