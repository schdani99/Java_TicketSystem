package ticketing_system.dto;

import ticketing_system.model.Priority;
import ticketing_system.model.Status;
import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        String title,
        String description,
        Status status,
        Priority priority,
        String authorUsername, // Csak a nevet adjuk vissza, nem a teljes User objektumot!
        String assigneeUsername,
        LocalDateTime createdAt
) {}
