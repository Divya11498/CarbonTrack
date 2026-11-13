package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    boolean existsByUserIdAndNotificationTypeAndReferenceKey(Long userId, String notificationType, String referenceKey);
    List<NotificationLog> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
    List<NotificationLog> findByUserIdAndIsReadFalse(Long userId);
}
