package ticketing_system.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ticketing_system.dto.CommentRequest;
import ticketing_system.dto.CommentResponse;
import ticketing_system.model.Comment;
import ticketing_system.model.User;
import ticketing_system.repository.UserRepository;
import ticketing_system.service.CommentService;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository; // Erre a bejelentkezett user azonosításához van szükség

    public CommentController(CommentService commentService, UserRepository userRepository) {
        this.commentService = commentService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<CommentResponse> getComments(@PathVariable Long ticketId) {
        return commentService.getCommentsByTicketId(ticketId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @RequestBody CommentRequest request,
            Authentication authentication // Automatikusan megkapjuk a bejelentkezett usert a Tokentől!
    ) {
        // Megkeressük az adatbázisban a tokent beküldő usert
        User author = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Felhasználó nem található!"));

        Comment savedComment = commentService.addComment(ticketId, request.content(), author);

        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(savedComment));
    }

    private CommentResponse mapToResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor().getUsername(),
                comment.getCreatedAt()
        );
    }}