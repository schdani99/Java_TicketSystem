package ticketing_system.controller;

import ticketing_system.dto.TicketCreateRequest;
import ticketing_system.dto.TicketResponse;
import ticketing_system.model.Ticket;
import ticketing_system.model.User;
import ticketing_system.service.TicketService;
import ticketing_system.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService; // Szükségünk van rá, hogy lekérjük a szerzőt

    public TicketController(TicketService ticketService, UserService userService) {
        this.ticketService = ticketService;
        this.userService = userService;
    }

    @GetMapping
    public List<TicketResponse> getAllTickets() {
        return ticketService.getAllTickets().stream()
                .map(this::mapToResponse) // Külön metódusba szerveztük az átalakítást az olvashatóságért
                .toList();
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@RequestBody TicketCreateRequest request) {
        // 1. Megkeressük a szerzőt
        User author = userService.getUserById(request.authorId())
                .orElseThrow(() -> new IllegalArgumentException("A megadott szerző nem létezik!"));

        // 2. DTO -> Entitás konverzió (Ráképezés)
        Ticket ticket = new Ticket();
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setPriority(request.priority());

        // 3. Mentés a Service-en keresztül
        Ticket savedTicket = ticketService.createTicket(ticket, author);

        // 4. Entitás -> DTO konverzió és válasz küldése
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(savedTicket));
    }

    // Segédmetódus a Ticket -> TicketResponse konverzióhoz
    private TicketResponse mapToResponse(Ticket ticket) {
        String assigneeName = ticket.getAssignee() != null ? ticket.getAssignee().getUsername() : "Nincs kiosztva";
        return new TicketResponse(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getAuthor().getUsername(), // Csak a nevük kell
                assigneeName,
                ticket.getCreatedAt()
        );
    }
}
