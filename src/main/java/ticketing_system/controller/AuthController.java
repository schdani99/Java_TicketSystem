package ticketing_system.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ticketing_system.dto.AuthRequest;
import ticketing_system.dto.AuthResponse;
import ticketing_system.dto.RegisterRequest;
import ticketing_system.model.User;
import ticketing_system.security.JwtService;
import ticketing_system.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, UserDetailsService userDetailsService, JwtService jwtService, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // 1. Felhasználó létrehozása
        User user = new User(request.username(), request.email(), request.password(), request.role());
        userService.createUser(user);

        // 2. Token generálása azonnal a regisztráció után
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String jwtToken = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(jwtToken));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        // 1. A Spring Security beépített menedzsere ellenőrzi a nevet és a jelszót
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        // 2. Ha ide eljut a kód, a jelszó helyes volt. Betöltjük a felhasználót.
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());

        // 3. Generálunk egy JWT tokent
        String jwtToken = jwtService.generateToken(userDetails);

        // 4. Visszaküldjük a kliensnek
        return ResponseEntity.ok(new AuthResponse(jwtToken));
    }
}