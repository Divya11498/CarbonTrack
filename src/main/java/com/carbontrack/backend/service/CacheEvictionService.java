package com.carbontrack.backend.service;

import com.carbontrack.backend.config.CacheConfig;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CacheEvictionService {

    private final CacheManager cacheManager;

    public CacheEvictionService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Clears analytics, organization overview, and leaderboard caches when
     * user activities, goals, or organization memberships change.
     */
    public void evictActivityDerivedCaches() {
        clearCaches(List.of(
                CacheConfig.CACHE_ANALYTICS_SUMMARY,
                CacheConfig.CACHE_ANALYTICS_TRENDS,
                CacheConfig.CACHE_ANALYTICS_BENCHMARKS,
                CacheConfig.CACHE_ORG_OVERVIEW,
                CacheConfig.CACHE_LEADERBOARD
        ));
    }

    public void evictGoalDerivedCaches() {
        clearCaches(List.of(
                CacheConfig.CACHE_ANALYTICS_SUMMARY,
                CacheConfig.CACHE_ORG_OVERVIEW
        ));
    }

    public void evictEmissionFactorCaches() {
        clearCaches(List.of(CacheConfig.CACHE_EMISSION_FACTORS));
    }

    private void clearCaches(List<String> names) {
        for (String name : names) {
            Cache cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        }
    }
}
