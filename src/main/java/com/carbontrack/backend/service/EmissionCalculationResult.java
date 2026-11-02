
package com.carbontrack.backend.service;

import java.math.BigDecimal;

public record EmissionCalculationResult(
        Long emissionFactorId,
        BigDecimal co2eKg
) {
}
