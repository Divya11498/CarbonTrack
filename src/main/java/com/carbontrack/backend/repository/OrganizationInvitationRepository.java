package com.carbontrack.backend.repository;

import com.carbontrack.backend.entity.OrganizationInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationInvitationRepository extends JpaRepository<OrganizationInvitation, Long> {
    List<OrganizationInvitation> findByOrganizationIdAndStatus(Long organizationId, String status);
    List<OrganizationInvitation> findByEmailAndStatus(String email, String status);
    Optional<OrganizationInvitation> findByInvitationToken(String invitationToken);
}
