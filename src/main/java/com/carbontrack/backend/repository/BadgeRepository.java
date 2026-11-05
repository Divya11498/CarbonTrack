package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Short> {
    Optional<Badge> findByCode(String code);
}
