package ticketing_system.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import ticketing_system.dto.TicketCreateRequest;
import ticketing_system.dto.TicketResponse;
import ticketing_system.model.Status;
import ticketing_system.model.Ticket;
import ticketing_system.model.User;
import ticketing_system.repository.UserRepository;
import ticketing_system.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ticketing_system.model.Role;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository; // Szükségünk van rá az aktuális user miatt

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    // 1. Jegyek listázása (Okosan, szerepkör alapján)
    @GetMapping
    public List<TicketResponse> getAllTickets(Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User nem található"));

        return ticketService.getTicketsForUser(currentUser).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // 2. Új jegy feladása (A tokent beküldő lesz a szerző!)
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@RequestBody TicketCreateRequest request, Authentication authentication) {
        User author = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User nem található"));

        Ticket ticket = new Ticket();
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setPriority(request.priority());

        Ticket savedTicket = ticketService.createTicket(ticket, author);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(savedTicket));
    }

    // 3. Státusz módosítása - CSAK ADMIN ÉS SUPPORT JOGGAL!
    @PutMapping("/{ticketId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')") // EZ A VARÁZSLAT! Spring Security blokkolja a sima usereket.
    public ResponseEntity<TicketResponse> updateStatus(@PathVariable Long ticketId, @RequestParam Status status) {
        Ticket updatedTicket = ticketService.updateTicketStatus(ticketId, status);
        return ResponseEntity.ok(mapToResponse(updatedTicket));
    }

    // 4. Jegy kiosztása - CSAK ADMIN ÉS SUPPORT JOGGAL!
    @PutMapping("/{ticketId}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long ticketId,
            @RequestParam Long assigneeId) {

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new IllegalArgumentException("A kiválasztott felhasználó nem található"));

        // Védelmi réteg: még ha valaki a keresőt megkerülve, közvetlen API-hívással
        // próbálna egy sima USER-t felelősként beállítani, azt is elutasítjuk.
        if (assignee.getRole() != Role.ADMIN && assignee.getRole() != Role.SUPPORT) {
            throw new IllegalArgumentException("Csak ADMIN vagy SUPPORT szerepkörű felhasználó lehet felelős");
        }

        Ticket updatedTicket = ticketService.assignTicket(ticketId, assignee);
        return ResponseEntity.ok(mapToResponse(updatedTicket));
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        String assigneeName = ticket.getAssignee() != null ? ticket.getAssignee().getUsername() : "Nincs kiosztva";
        return new TicketResponse(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getAuthor().getUsername(),
                assigneeName,
                ticket.getCreatedAt()
        );
    }
}