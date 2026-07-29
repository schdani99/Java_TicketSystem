package ticketing_system.repository;

import ticketing_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import ticketing_system.model.Role; // Új import

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // ÚJ: Keresés névtöredék alapján (Nagy/Kisbetű független) a megadott szerepkörök között
    List<User> findByUsernameContainingIgnoreCaseAndRoleIn(String username, List<Role> roles);
}