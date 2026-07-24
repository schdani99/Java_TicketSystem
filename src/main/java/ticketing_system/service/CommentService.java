package ticketing_system.service;

import org.springframework.stereotype.Service;
import ticketing_system.model.Comment;
import ticketing_system.model.Ticket;
import ticketing_system.model.User;
import ticketing_system.repository.CommentRepository;
import ticketing_system.repository.TicketRepository;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    public CommentService(CommentRepository commentRepository, TicketRepository ticketRepository) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
    }

    public List<Comment> getCommentsByTicketId(Long ticketId) {
        return commentRepository.findByTicketId(ticketId);
    }

    public Comment addComment(Long ticketId, String content, User author) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("A jegy nem található: " + ticketId));

        Comment comment = new Comment();
        comment.setContent(content);
        comment.setTicket(ticket);
        comment.setAuthor(author);

        return commentRepository.save(comment);
    }
}
