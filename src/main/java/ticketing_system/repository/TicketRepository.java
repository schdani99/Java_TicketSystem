package ticketing_system.repository;

import ticketing_system.model.Ticket;
import ticketing_system.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Lekérdezi egy adott felhasználó (szerző) összes jegyét
    List<Ticket> findByAuthorId(Long authorId);

    // Lekérdezi azokat a jegyeket, amik egy adott Supportoshoz vannak rendelve
    List<Ticket> findByAssigneeId(Long assigneeId);

    // Lekérdezi a jegyeket státusz alapján (pl. az összes OPEN jegy)
    List<Ticket> findByStatus(Status status);
}
