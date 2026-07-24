package ticketing_system.repository;

import ticketing_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // A Spring Data JPA "Mágiája": Ebből a metódusnévből a Spring
    // automatikusan generál egy "SELECT * FROM users WHERE username = ?" SQL-t!
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}