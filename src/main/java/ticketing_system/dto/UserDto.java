package ticketing_system.dto;

import ticketing_system.model.Role;

public record UserDto(
        Long id,
        String username,
        String email,
        Role role
) {}