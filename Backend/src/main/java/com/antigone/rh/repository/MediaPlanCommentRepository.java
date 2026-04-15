package com.antigone.rh.repository;

import com.antigone.rh.entity.MediaPlanComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaPlanCommentRepository extends JpaRepository<MediaPlanComment, Long> {
    List<MediaPlanComment> findByMediaPlanId(Long mediaPlanId);

    List<MediaPlanComment> findByDraftKey(String draftKey);

    List<MediaPlanComment> findByMediaPlanIdIn(List<Long> mediaPlanIds);

    List<MediaPlanComment> findByClientIdAndMonthKey(Long clientId, String monthKey);
}
