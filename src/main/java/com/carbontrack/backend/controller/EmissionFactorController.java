package com.carbontrack.backend.controller;

import com.carbontrack.backend.config.CacheConfig;
import com.carbontrack.backend.entity.ActivityCategory;
import com.carbontrack.backend.entity.ActivityType;
import com.carbontrack.backend.entity.EmissionFactor;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.ActivityCategoryRepository;
import com.carbontrack.backend.repository.ActivityTypeRepository;
import com.carbontrack.backend.repository.EmissionFactorRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.CacheEvictionService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/emission-factors")
public class EmissionFactorController {

    private final EmissionFactorRepository emissionFactorRepository;
    private final ActivityTypeRepository activityTypeRepository;
    private final ActivityCategoryRepository activityCategoryRepository;
    private final UserRepository userRepository;
    private final CacheEvictionService cacheEvictionService;

    public EmissionFactorController(
            EmissionFactorRepository emissionFactorRepository,
            ActivityTypeRepository activityTypeRepository,
            ActivityCategoryRepository activityCategoryRepository,
            UserRepository userRepository,
            CacheEvictionService cacheEvictionService) {
        this.emissionFactorRepository = emissionFactorRepository;
        this.activityTypeRepository = activityTypeRepository;
        this.activityCategoryRepository = activityCategoryRepository;
        this.userRepository = userRepository;
        this.cacheEvictionService = cacheEvictionService;
    }

    @GetMapping
    @Cacheable(value = CacheConfig.CACHE_EMISSION_FACTORS, key = "'all'")
    public List<Map<String, Object>> getAllFactors() {
        Map<Short, ActivityType> typeMap = activityTypeRepository.findAll().stream()
                .collect(Collectors.toMap(ActivityType::getId, t -> t));
        Map<Short, ActivityCategory> catMap = activityCategoryRepository.findAll().stream()
                .collect(Collectors.toMap(ActivityCategory::getId, c -> c));

        return emissionFactorRepository.findAll().stream()
                .sorted(Comparator.comparing(EmissionFactor::getActivityTypeId))
                .map(f -> {
                    ActivityType t = typeMap.get(f.getActivityTypeId());
                    ActivityCategory c = t != null ? catMap.get(t.getCategoryId()) : null;
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", f.getId());
                    item.put("activityTypeId", f.getActivityTypeId());
                    item.put("activityName", t != null ? t.getName() : "Activity #" + f.getActivityTypeId());
                    item.put("categoryId", t != null ? t.getCategoryId() : null);
                    item.put("categoryName", c != null ? c.getName() : "other");
                    item.put("unitType", t != null ? t.getUnitType() : f.getUnit());
                    item.put("factorValue", f.getFactorValue());
                    item.put("unit", f.getUnit());
                    item.put("sourceName", f.getSourceName());
                    item.put("sourceVersion", f.getSourceVersion());
                    item.put("region", f.getRegion());
                    item.put("scope", f.getScope());
                    item.put("isActive", f.getIsActive());
                    item.put("notes", f.getNotes());
                    return item;
                })
                .toList();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFactor(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!"ADMIN".equalsIgnoreCase(user.getRole()) && !"ORG_ADMIN".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Administrator privileges required to modify emission factors."));
        }

        Optional<EmissionFactor> opt = emissionFactorRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        EmissionFactor factor = opt.get();
        if (payload.containsKey("factorValue") && payload.get("factorValue") != null) {
            BigDecimal val = new BigDecimal(payload.get("factorValue").toString());
            if (val.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Emission factor cannot be negative."));
            }
            factor.setFactorValue(val);
        }
        if (payload.containsKey("sourceName") && payload.get("sourceName") != null) {
            factor.setSourceName(payload.get("sourceName").toString());
        }
        if (payload.containsKey("notes")) {
            factor.setNotes(payload.get("notes") != null ? payload.get("notes").toString() : null);
        }
        if (payload.containsKey("isActive") && payload.get("isActive") != null) {
            factor.setIsActive(Boolean.valueOf(payload.get("isActive").toString()));
        }

        EmissionFactor saved = emissionFactorRepository.save(factor);
        cacheEvictionService.evictEmissionFactorCaches();
        return ResponseEntity.ok(saved);
    }

    @PostMapping
    public ResponseEntity<?> createFactor(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!"ADMIN".equalsIgnoreCase(user.getRole()) && !"ORG_ADMIN".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Administrator privileges required to create emission factors."));
        }

        if (payload.get("activityTypeId") == null || payload.get("factorValue") == null || payload.get("unit") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "activityTypeId, factorValue, and unit are required."));
        }

        EmissionFactor factor = new EmissionFactor();
        factor.setActivityTypeId(Short.valueOf(payload.get("activityTypeId").toString()));
        factor.setFactorValue(new BigDecimal(payload.get("factorValue").toString()));
        factor.setUnit(payload.get("unit").toString());
        factor.setSourceName(payload.getOrDefault("sourceName", "Custom").toString());
        factor.setSourceVersion(payload.getOrDefault("sourceVersion", "2026").toString());
        factor.setRegion(payload.getOrDefault("region", "global").toString());
        factor.setScope(payload.getOrDefault("scope", "DIRECT").toString());
        factor.setValidFrom(OffsetDateTime.now().minusYears(1));
        factor.setIsActive(true);
        factor.setCreatedBy(user.getId());
        if (payload.get("notes") != null) {
            factor.setNotes(payload.get("notes").toString());
        }

        EmissionFactor saved = emissionFactorRepository.save(factor);
        cacheEvictionService.evictEmissionFactorCaches();
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .orElse(null);
    }
}
