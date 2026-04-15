package com.antigone.rh.controller;

import com.antigone.rh.dto.MediaPlanCommentDTO;
import com.antigone.rh.dto.MediaPlanCommentRequest;
import com.antigone.rh.service.MediaPlanCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mediaplan-comments")
@RequiredArgsConstructor
public class MediaPlanCommentController {

    private final MediaPlanCommentService commentService;

    @PostMapping
    public ResponseEntity<MediaPlanCommentDTO> create(@RequestBody MediaPlanCommentRequest req) {
        return ResponseEntity.ok(commentService.create(req));
    }

    @GetMapping("/by-mediaplan/{mediaPlanId}")
    public ResponseEntity<List<MediaPlanCommentDTO>> getByMediaPlan(@PathVariable Long mediaPlanId) {
        return ResponseEntity.ok(commentService.getByMediaPlanId(mediaPlanId));
    }

    @GetMapping("/by-mediaplan-ids")
    public ResponseEntity<List<MediaPlanCommentDTO>> getByMediaPlanIds(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(commentService.getByMediaPlanIds(ids));
    }

    @GetMapping("/by-draft/{draftKey}")
    public ResponseEntity<List<MediaPlanCommentDTO>> getByDraftKey(@PathVariable String draftKey) {
        return ResponseEntity.ok(commentService.getByDraftKey(draftKey));
    }

    @GetMapping("/by-client-month")
    public ResponseEntity<List<MediaPlanCommentDTO>> getByClientIdAndMonthKey(
            @RequestParam Long clientId,
            @RequestParam String monthKey) {
        return ResponseEntity.ok(commentService.getByClientIdAndMonthKey(clientId, monthKey));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
