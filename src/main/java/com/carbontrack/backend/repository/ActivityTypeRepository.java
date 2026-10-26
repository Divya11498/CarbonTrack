
package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityTypeRepository
        extends JpaRepository<ActivityType, Short> {

    List<ActivityType> findByActiveTrue();

    Optional<ActivityType> findByName(String name);
}
