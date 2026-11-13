package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.UserInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInvitationRepository extends JpaRepository<UserInvitation, Long> {
    Optional<UserInvitation> findByInvitationToken(String invitationToken);
    List<UserInvitation> findByInviterUserIdOrderByCreatedAtDesc(Long inviterUserId);
    List<UserInvitation> findByInviterUserIdAndStatusOrderByCreatedAtDesc(Long inviterUserId, String status);
    Optional<UserInvitation> findByInviterUserIdAndEmailAndStatus(Long inviterUserId, String email, String status);
}
