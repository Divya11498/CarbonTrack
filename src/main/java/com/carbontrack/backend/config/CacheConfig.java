package com.carbontrack.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    public static final String CACHE_ANALYTICS_SUMMARY = "analytics_summary";
    public static final String CACHE_ANALYTICS_TRENDS = "analytics_trends";
    public static final String CACHE_ANALYTICS_BENCHMARKS = "analytics_benchmarks";
    public static final String CACHE_ORG_OVERVIEW = "org_overview";
    public static final String CACHE_LEADERBOARD = "leaderboard";
    public static final String CACHE_EMISSION_FACTORS = "emission_factors";

    private static final List<String> CACHE_NAMES = List.of(
            CACHE_ANALYTICS_SUMMARY,
            CACHE_ANALYTICS_TRENDS,
            CACHE_ANALYTICS_BENCHMARKS,
            CACHE_ORG_OVERVIEW,
            CACHE_LEADERBOARD,
            CACHE_EMISSION_FACTORS
    );

    @Bean
    public CacheManager cacheManager(ObjectProvider<RedisConnectionFactory> connectionFactoryProvider) {
        RedisConnectionFactory connectionFactory = connectionFactoryProvider.getIfAvailable();
        if (connectionFactory != null) {
            try (RedisConnection conn = connectionFactory.getConnection()) {
                String pong = conn.ping();
                if (pong != null) {
                    log.info("Redis reachable ({}); enabling RedisCacheManager for CarbonTrack.", pong);
                    RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                            .entryTtl(Duration.ofMinutes(10))
                            .disableCachingNullValues()
                            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.json()));

                    return RedisCacheManager.builder(connectionFactory)
                            .cacheDefaults(defaults)
                            .initialCacheNames(Set.copyOf(CACHE_NAMES))
                            .build();
                }
            } catch (Exception ex) {
                log.warn("Redis not reachable locally ({}); falling back to in-memory ConcurrentMapCacheManager.", ex.getMessage());
            }
        }
        return new ConcurrentMapCacheManager(CACHE_NAMES.toArray(String[]::new));
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache GET error on {}[{}]: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Cache PUT error on {}[{}]: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache EVICT error on {}[{}]: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Cache CLEAR error on {}: {}", cache.getName(), exception.getMessage());
            }
        };
    }
}
