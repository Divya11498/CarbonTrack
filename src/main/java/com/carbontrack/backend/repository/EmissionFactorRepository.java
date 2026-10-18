
package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, Long> {

    List<EmissionFactor> findByActivityTypeIdAndIsActiveTrue(Short activityTypeId);
}