
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.repository.ActivityLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private EmissionCalculationService emissionCalculationService;

    @InjectMocks
    private ActivityLogService activityLogService;

    private ActivityLog activityLog;

    @BeforeEach
    void setUp() {
        activityLog = new ActivityLog();
        activityLog.setUserId(1L);
        activityLog.setCategoryId((short) 1);
        activityLog.setActivityTypeId((short) 1);
        activityLog.setLogDate(LocalDate.of(2026, 6, 1));
        activityLog.setQuantity(new BigDecimal("25"));
        activityLog.setUnit("km");
    }

    @Test
    void calculatesEmissionsAndSavesActivity() {

        EmissionCalculationResult calculationResult =
                new EmissionCalculationResult(
                        10L,
                        new BigDecimal("4.800")
                );

        when(emissionCalculationService.calculateEmission(
                (short) 1,
                new BigDecimal("25"),
                "km",
                LocalDate.of(2026, 6, 1)
        )).thenReturn(calculationResult);

        when(activityLogRepository.save(any(ActivityLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ActivityLog savedActivity =
                activityLogService.createActivity(activityLog);

        assertEquals(
                0,
                new BigDecimal("4.800")
                        .compareTo(savedActivity.getCo2eKg())
        );

        assertEquals(10L, savedActivity.getEmissionFactorId());

        verify(emissionCalculationService, times(1))
                .calculateEmission(
                        (short) 1,
                        new BigDecimal("25"),
                        "km",
                        LocalDate.of(2026, 6, 1)
                );

        verify(activityLogRepository, times(1))
                .save(activityLog);
    }

    @Test
    void rejectsNullActivity() {
        assertThrows(
                IllegalArgumentException.class,
                () -> activityLogService.createActivity(null)
        );

        verify(activityLogRepository, never())
                .save(any(ActivityLog.class));
    }
}
