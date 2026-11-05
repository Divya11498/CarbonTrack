package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.ActivityCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityCategoryRepository extends JpaRepository<ActivityCategory, Short> {
}
