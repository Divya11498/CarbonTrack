
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.EmissionFactor;
import com.carbontrack.backend.repository.EmissionFactorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmissionCalculationServiceTest {

    @Mock
    private EmissionFactorRepository emissionFactorRepository;

    @InjectMocks
    private EmissionCalculationService service;

    private EmissionFactor factor;

    @BeforeEach
    void setUp() {
        factor = new EmissionFactor();
        factor.setActivityTypeId((short) 1);
        factor.setSourceName("Test source");
        factor.setFactorValue(new BigDecimal("0.192"));
        factor.setUnit("km");
        factor.setValidFrom(
                OffsetDateTime.of(
                        2026, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC));
        factor.setValidTo(null);
        factor.setIsActive(true);
    }

    @Test
    void calculatesCorrectEmission() {
        when(emissionFactorRepository
                .findByActivityTypeIdAndIsActiveTrue((short) 1))
                .thenReturn(List.of(factor));

        EmissionCalculationResult result = service.calculateEmission(
                (short) 1,
                new BigDecimal("25"),
                "km",
                LocalDate.of(2026, 6, 1));

        assertEquals(
                0,
                new BigDecimal("4.800").compareTo(result.co2eKg()));
    }

    @Test
    void rejectsNegativeQuantity() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmission(
                        (short) 1,
                        new BigDecimal("-1"),
                        "km",
                        LocalDate.of(2026, 6, 1))
        );
    }

    @Test
    void rejectsWhenNoFactorExists() {
        when(emissionFactorRepository
                .findByActivityTypeIdAndIsActiveTrue((short) 1))
                .thenReturn(List.of());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmission(
                        (short) 1,
                        new BigDecimal("10"),
                        "km",
                        LocalDate.of(2026, 6, 1))
        );
    }

    @Test
    void rejectsExpiredEmissionFactor() {

        factor.setValidTo(
                OffsetDateTime.of(
                        2026, 5, 31, 23, 59, 59, 0,
                        ZoneOffset.UTC));

        when(emissionFactorRepository
                .findByActivityTypeIdAndIsActiveTrue((short) 1))
                .thenReturn(List.of(factor));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmission(
                        (short) 1,
                        new BigDecimal("25"),
                        "km",
                        LocalDate.of(2026, 6, 1))
        );
    }

    @Test
    void rejectsMultipleMatchingEmissionFactors() {

        EmissionFactor secondFactor = new EmissionFactor();
        secondFactor.setActivityTypeId((short) 1);
        secondFactor.setSourceName("Second test source");
        secondFactor.setFactorValue(new BigDecimal("0.200"));
        secondFactor.setUnit("km");
        secondFactor.setValidFrom(
                OffsetDateTime.of(
                        2026, 1, 1, 0, 0, 0, 0,
                        ZoneOffset.UTC));
        secondFactor.setValidTo(null);
        secondFactor.setIsActive(true);

        when(emissionFactorRepository
                .findByActivityTypeIdAndIsActiveTrue((short) 1))
                .thenReturn(List.of(factor, secondFactor));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmission(
                        (short) 1,
                        new BigDecimal("25"),
                        "km",
                        LocalDate.of(2026, 6, 1))
        );
    }


}
