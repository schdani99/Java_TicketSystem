package ticketing_system.service;

import ticketing_system.model.Role;
import ticketing_system.model.Status;
import ticketing_system.model.Ticket;
import ticketing_system.model.User;
import ticketing_system.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    // ÚJ METÓDUS: Ha Admin vagy Support, mindent lát. Ha User, csak a sajátját.
    public List<Ticket> getTicketsForUser(User user) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.SUPPORT) {
            return ticketRepository.findAll();
        } else {
            return ticketRepository.findByAuthorId(user.getId());
        }
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("A jegy nem található ezzel az ID-val: " + id));
    }

    public Ticket createTicket(Ticket ticket, User author) {
        ticket.setAuthor(author);
        return ticketRepository.save(ticket);
    }

    public Ticket updateTicketStatus(Long ticketId, Status newStatus) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setStatus(newStatus);
        return ticketRepository.save(ticket);
    }

    // ÚJ METÓDUS: Jegy kiosztása egy Supportosnak
    public Ticket assignTicket(Long ticketId, User assignee) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setAssignee(assignee);
        ticket.setStatus(Status.IN_PROGRESS); // Ha ki van osztva, automatikusan Folyamatban lesz
        return ticketRepository.save(ticket);
    }
}
