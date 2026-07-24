package ticketing_system.dto;

import ticketing_system.model.Priority;

public record TicketCreateRequest(
        String title,
        String description,
        Priority priority,
        Long authorId // Ideiglenesen bekérjük, ki az író, amíg nincs Spring Security
) {}
