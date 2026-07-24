package ticketing_system.service;

import ticketing_system.model.Status;
import ticketing_system.model.Ticket;
import ticketing_system.model.User;
import ticketing_system.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    // Dependency Injection
    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Ticket getTicketById(Long id) {
        // Ha nem találja a jegyet, azonnal hibát dobunk (Később ezt szép HTTP 404-re alakítjuk)
        return ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("A jegy nem található ezzel az ID-val: " + id));
    }

    public Ticket createTicket(Ticket ticket, User author) {
        ticket.setAuthor(author);
        // A @PrePersist a Ticket entitásban automatikusan beállítja a dátumot és az OPEN státuszt!
        return ticketRepository.save(ticket);
    }

    // Üzleti logika: Státusz módosítása (pl. egy Supportos elkezdi feldolgozni)
    public Ticket updateTicketStatus(Long ticketId, Status newStatus) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setStatus(newStatus);

        // Mivel módosítottuk az objektumot, a save() most nem új sort hoz létre (INSERT),
        // hanem frissíti a meglévőt (UPDATE). A Spring JPA ezt is magától tudja!
        return ticketRepository.save(ticket);
    }
}