package ticketing_system.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import ticketing_system.dto.ErrorResponse;

import java.time.LocalDateTime;

@RestControllerAdvice // Ez jelzi, hogy ő a Globális Hibakezelő
public class GlobalExceptionHandler {

    // 1. Saját hibáink elkapása (pl. "Foglalt email", "Jegy nem található")
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "Érvénytelen kérés",
                ex.getMessage() // Itt adjuk vissza a mi saját, magyar nyelvű hibaüzenetünket a Service-ből
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // 2. Jogosultsági hibák elkapása (Ha a @PreAuthorize megállít valakit)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                "Hozzáférés megtagadva",
                "Nincs jogosultságod a művelet végrehajtásához!"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    // 3. Minden egyéb, váratlan hiba elkapása (Hogy sose omoljon össze csúnyán a szerver)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Rendszerhiba",
                "Váratlan hiba történt a szerveren: " + ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}