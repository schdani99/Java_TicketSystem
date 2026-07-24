package ticketing_system.dto;

public record AuthRequest(
        String username,
        String password
) {}
