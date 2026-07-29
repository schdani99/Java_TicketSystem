package ticketing_system.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ticketing_system.dto.UserDto;
import ticketing_system.model.Role;
import ticketing_system.model.User;
import ticketing_system.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')") // Ez az egész vezérlőt levédi, csak ADMIN férhet hozzá!
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    // 1. Összes felhasználó listázása
    @GetMapping("/users")
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers().stream()
                .map(u -> new UserDto(u.getId(), u.getUsername(), u.getEmail(), u.getRole()))
                .toList();
    }

    // 2. Felhasználó jogosultságának (Role) módosítása
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id, @RequestParam Role role) {
        User updatedUser = userService.updateUserRole(id, role);
        UserDto dto = new UserDto(
                updatedUser.getId(),
                updatedUser.getUsername(),
                updatedUser.getEmail(),
                updatedUser.getRole()
        );
        return ResponseEntity.ok(dto);
    }
}