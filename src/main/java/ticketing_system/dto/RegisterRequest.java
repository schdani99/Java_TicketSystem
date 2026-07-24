package ticketing_system.dto;

import ticketing_system.model.Role;

public record RegisterRequest(
        String username,
        String email,
        String password,
        Role role
) {}
