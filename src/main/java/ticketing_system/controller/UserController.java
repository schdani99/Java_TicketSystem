package ticketing_system.controller;

import ticketing_system.dto.UserDto;
import ticketing_system.model.User;
import ticketing_system.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Jelzi a Springnek, hogy ez REST API végpontokat tartalmaz (JSON-t ad vissza)
@RequestMapping("/api/users") // Minden metódus alap címe ez lesz
public class UserController {

    private final UserService userService;

    // Konstruktor injektálás
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 1. Összes felhasználó lekérdezése: GET /api/users
    @GetMapping
    public List<UserDto> getAllUsers() {
        // Stream API  segítségével átalakítjuk a User entitásokat UserDto-kká
        return userService.getAllUsers().stream()
                .map(user -> new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole()))
                .toList(); 
    }

    // 2. Felhasználó létrehozása (Regisztráció egyszerűsítve): POST /api/users
    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody User user) {
        // A @RequestBody jelzi, hogy a beérkező JSON-t alakítsa át User objektummá.
        // Figyelem: Később ide is külön CreateUserRequest DTO-t kellene írni, de most jó.
        try {
            User savedUser = userService.createUser(user);
            UserDto dto = new UserDto(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail(), savedUser.getRole());

            // 201 Created HTTP státuszt adunk vissza siker esetén
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            // Ha foglalt a név/email, 400 Bad Requestet adunk (Egyelőre a hibakezelés primitív)
            return ResponseEntity.badRequest().build();
        }
    }
}