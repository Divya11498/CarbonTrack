
package com.carbontrack.backend.service;

import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.repository.BadgeRepository;
import com.carbontrack.backend.repository.UserBadgeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    public BadgeService(
            BadgeRepository badgeRepository,
            UserBadgeRepository userBadgeRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
    }

    @Transactional(readOnly = true)
    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<UserBadge> getUserBadges(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        return userBadgeRepository.findByUserId(userId);
    }

    @Transactional
    public UserBadge awardBadge(Long userId, String badgeCode) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (badgeCode == null || badgeCode.isBlank()) {
            throw new IllegalArgumentException("Badge code is required");
        }

        Badge badge = badgeRepository.findByCode(badgeCode)
                .orElseThrow(() ->
                        new IllegalArgumentException("Badge not found: " + badgeCode));

        boolean alreadyAwarded =
                userBadgeRepository.existsByUserIdAndBadgeId(
                        userId, badge.getId());

        if (alreadyAwarded) {
            return userBadgeRepository.findByUserId(userId)
                    .stream()
                    .filter(userBadge ->
                            userBadge.getBadgeId().equals(badge.getId()))
                    .findFirst()
                    .orElseThrow();
        }

        UserBadge userBadge = new UserBadge();
        userBadge.setUserId(userId);
        userBadge.setBadgeId(badge.getId());

        return userBadgeRepository.save(userBadge);
    }
}
