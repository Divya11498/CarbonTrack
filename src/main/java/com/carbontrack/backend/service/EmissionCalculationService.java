
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.EmissionFactor;
import com.carbontrack.backend.repository.EmissionFactorRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class EmissionCalculationService {

    private final EmissionFactorRepository emissionFactorRepository;

    public EmissionCalculationService(
            EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    public EmissionCalculationResult calculateEmission(
            Short activityTypeId,
            BigDecimal quantity,
            String unit,
            LocalDate activityDate) {

        if (activityTypeId == null) {
            throw new IllegalArgumentException(
                    "Activity type ID is required");
        }

        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Quantity must be zero or greater");
        }

        if (unit == null || unit.isBlank()) {
            throw new IllegalArgumentException("Unit is required");
        }

        if (activityDate == null) {
            throw new IllegalArgumentException(
                    "Activity date is required");
        }

        OffsetDateTime startOfDay =
                activityDate.atStartOfDay().atOffset(ZoneOffset.UTC);

        OffsetDateTime startOfNextDay =
                activityDate.plusDays(1)
                        .atStartOfDay()
                        .atOffset(ZoneOffset.UTC);

        List<EmissionFactor> validFactors =
                emissionFactorRepository
                        .findByActivityTypeIdAndIsActiveTrue(activityTypeId)
                        .stream()
                        .filter(factor ->
                                factor.getUnit() != null
                                        && factor.getUnit()
                                        .trim()
                                        .equalsIgnoreCase(unit.trim()))
                        .filter(factor ->
                                factor.getValidFrom() != null
                                        && !factor.getValidFrom()
                                        .isAfter(startOfNextDay.minusNanos(1)))
                        .filter(factor ->
                                factor.getValidTo() == null
                                        || factor.getValidTo()
                                        .isAfter(startOfDay))
                        .toList();

        if (validFactors.isEmpty()) {
            throw new IllegalArgumentException(
                    "No active emission factor found for this activity, "
                            + "unit, and date");
        }

        if (validFactors.size() > 1) {
            throw new IllegalArgumentException(
                    "Multiple valid emission factors found. "
                            + "Database factors need to be reviewed.");
        }

        EmissionFactor factor = validFactors.get(0);

        BigDecimal co2e =
                quantity.multiply(factor.getFactorValue());

        return new EmissionCalculationResult(
                factor.getId(),
                co2e
        );
    }
}
