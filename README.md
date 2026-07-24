# Jegykezelő Rendszer (Ticket System) — Projekt dokumentáció

> Ez a dokumentum az eredeti rendszertervet (l. lent) és a projekt azóta megvalósult, tényleges állapotát foglalja össze — beleértve a frontendet is, ami az eredeti tervben még nem szerepelt.

---

## 0. Vezetői összefoglaló

Egy RESTful API alapú jegykezelő rendszer, ahol a felhasználók hibajegyeket hozhatnak létre, a támogatók (Support) kezelhetik ezeket, az adminisztrátorok pedig a felhasználókat menedzselik. A rendszer Docker Compose-szal konténerizált, és mára egy teljes, működő React frontenddel is ki van egészítve — vagyis a tervezett backend-only API-ból egy end-to-end, bejelentkezéssel védett full-stack alkalmazás lett.

---

## 1. Jelenlegi állapot / tech stack

| Réteg | Technológia |
|---|---|
| Backend nyelv | Java 21 |
| Keretrendszer | Spring Boot 4.1.0 |
| Adatbázis | PostgreSQL 15 |
| ORM | Spring Data JPA / Hibernate (`ddl-auto=update`) |
| Biztonság | Spring Security + JWT (jjwt könyvtár) |
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin, CSS-first konfiguráció) |
| Ikonok | lucide-react |
| Konténerizáció | Docker + Docker Compose |

**Eltérés az eredeti tervhez képest:**
- Az eredeti terv Flyway/Liquibase adatbázis-migrációt javasolt — jelenleg Hibernate `ddl-auto=update` van használatban (a séma automatikusan generálódik az entitásokból). Migrációs eszköz egyelőre nincs bevezetve.
- Swagger/OpenAPI dokumentáció az eredeti tervben szerepelt, de a jelenlegi kódbázisban még nincs bekötve.
- A tervben nem szerepelt frontend — ez menet közben került a projektbe, és mára a rendszer szerves részét képezi.

---

## 2. Architektúra

Rétegzett (Controller → Service → Repository) felépítés, a tervnek megfelelően:

- **Controller réteg**: HTTP kérések fogadása, DTO-kkal kommunikál (sosem adja vissza közvetlenül az entitásokat)
- **Service réteg**: üzleti logika (pl. ki láthat milyen jegyeket, jegy kiosztása)
- **Repository réteg**: Spring Data JPA a PostgreSQL-lel

### Mappaszerkezet

```
Java_TicketSystem/
├── src/main/java/
│   ├── ticketing_system/          ← Spring Boot backend
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── dto/
│   │   ├── security/
│   │   └── exception/
│   └── ticketing-frontend/        ← React + Vite frontend
│       └── src/App.jsx
├── src/main/resources/application.properties
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

> ⚠️ **Ismert strukturális probléma**: a `ticketing-frontend` jelenleg a Java forrásmappa (`src/main/java`) alatt van, a `ticketing_system` package mellett. Ez működik (Maven csak `.java` fájlokat fordít), de nem tiszta megoldás — a Docker build feleslegesen másolja be a frontend forrását is a build kontextusba. Érdemes lenne kiemelni a repo gyökerébe.

---

## 3. Adatmodell

### User (Felhasználó)
| Mező | Típus |
|---|---|
| id | Long, auto-increment |
| username | String, unique |
| email | String, unique |
| password | String, BCrypt-tel hash-elve |
| role | Enum: `USER`, `SUPPORT`, `ADMIN` |

### Ticket (Hibajegy)
| Mező | Típus |
|---|---|
| id | Long, auto-increment |
| title | String, max 100 karakter |
| description | Text |
| status | Enum: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| priority | Enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| author | User (ManyToOne, kötelező) |
| assignee | User (ManyToOne, opcionális) |
| createdAt / updatedAt | LocalDateTime (automatikus) |

### Comment (Hozzászólás) — a tervben még nem szerepelt, azóta hozzáadva
| Mező | Típus |
|---|---|
| id | Long |
| content | String |
| author | User |
| ticket | Ticket |
| createdAt | LocalDateTime |

---

## 4. API végpontok (jelenlegi állapot)

### Auth (`/api/auth`) — nyilvános
| Metódus | Végpont | Leírás |
|---|---|---|
| POST | `/api/auth/register` | Regisztráció, azonnali JWT tokennel tér vissza |
| POST | `/api/auth/login` | Bejelentkezés, JWT tokennel tér vissza |

### Tickets (`/api/tickets`) — bejelentkezés szükséges
| Metódus | Végpont | Jogosultság | Leírás |
|---|---|---|---|
| GET | `/api/tickets` | bejelentkezett user | `USER` csak a sajátjait látja, `ADMIN`/`SUPPORT` mindent |
| POST | `/api/tickets` | bejelentkezett user | Új jegy létrehozása, szerző = a token tulajdonosa |
| PUT | `/api/tickets/{id}/status` | `ADMIN`, `SUPPORT` | Státusz módosítása |
| PUT | `/api/tickets/{id}/assign` | `ADMIN`, `SUPPORT` | Jegy kiosztása magának |

### Comments (`/api/tickets/{ticketId}/comments`)
| Metódus | Végpont | Leírás |
|---|---|---|
| GET | `/api/tickets/{ticketId}/comments` | Hozzászólások listázása |
| POST | `/api/tickets/{ticketId}/comments` | Új hozzászólás, szerző = a token tulajdonosa |

### Users (`/api/users`)
| Metódus | Végpont | Leírás |
|---|---|---|
| GET | `/api/users` | Összes felhasználó listázása |
| POST | `/api/users` | Felhasználó létrehozása (egyszerűsített, nem az elsődleges regisztrációs útvonal) |

> ⚠️ **Biztonsági megjegyzés**: a `RegisterRequest` DTO egy `role` mezőt is elfogad a kliens kérésből, amit a `UserService.createUser` validáció nélkül elment. Ez azt jelenti, hogy elméletileg bárki `"role": "ADMIN"`-t küldve adminként regisztrálhatna, ha nem a frontendünkön keresztül hívja a végpontot. A frontend jelenleg mindig fixen `"USER"`-t küld, de a backend oldali védelem (mindig `Role.USER` kényszerítése publikus regisztrációnál) még nincs bevezetve.

---

## 5. Biztonság (Spring Security + JWT)

- Stateless munkamenet (`SessionCreationPolicy.STATELESS`)
- `JwtAuthenticationFilter` minden kérésnél ellenőrzi az `Authorization: Bearer <token>` fejlécet
- `CustomUserDetailsService` tölti be a usert az adatbázisból a JWT-ben lévő felhasználónév alapján
- Jelszavak BCrypt-tel hash-elve
- CORS engedélyezve `http://localhost:5173`-ra (a Vite dev szerver portja)
- `@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")` védi a státusz-módosítást és a kiosztást

---

## 6. Frontend (React + Vite + Tailwind)

Az eredeti tervben nem szerepelt, útközben lett hozzáadva. Jellemzői:

- **Design**: fenyőzöld/fehér, "ticket-stub" vizuális motívummal (perforált jegy-cimke a listaelemeken), Manrope + JetBrains Mono betűtípus-pár
- **Nézetek**: bejelentkezés/regisztráció → jegylista (szűrhető státusz szerint) → jegy részletei → új jegy felvétele
- **Állapotkezelés**: egyszerű React `useState`/`useEffect`, nincs külön state management könyvtár
- **API kommunikáció**: egy központi `apiFetch` segédfüggvényen keresztül, ami automatikusan hozzáadja a JWT tokent minden kéréshez, és 401 esetén kijelentkezteti a felhasználót
- **Token tárolás**: `localStorage`

### Frontend futtatása
```powershell
cd ticketing-frontend
npm install
npm run dev
```
Elérhető: `http://localhost:5173`

---

## 7. Futtatás Dockerrel

```powershell
docker compose up --build
```

Ez elindítja:
- `db` — PostgreSQL 15, port `5432`
- `backend` — Spring Boot app, port `8080`

Szükséges egy `.env` fájl a projekt gyökerében (nincs verziókezelve):
```
DB_USER=admin
DB_PASSWORD=secret
JWT_SECRET=<titkos kulcs>
JWT_EXPIRATION=86400000
```

---

## 8. Ismert hiányosságok / következő lépések

- [ ] Flyway/Liquibase migráció bevezetése a `ddl-auto=update` helyett
- [ ] Swagger/OpenAPI dokumentáció bekötése
- [ ] `RegisterRequest.role` kényszerítése `USER`-re publikus regisztrációnál (biztonsági javítás)
- [ ] `ticketing-frontend` kiemelése a `src/main/java` alól a repo gyökerébe
- [ ] Frontend: jegy státusz-módosítás és kiosztás gombok bekötése (a backend végpont már kész: `PUT /api/tickets/{id}/status`, `PUT /api/tickets/{id}/assign`)
- [ ] Frontend: hozzászólások (`comments`) megjelenítése és írása a jegy részletező nézetben
- [ ] Frontend: admin/support szerepkör-alapú felület (pl. minden jegy listázása, kiosztás gomb)

---

## Eredeti rendszerterv (kiindulási állapot)

*A projekt ezzel a tervvel indult — az alábbi az eredeti dokumentum tartalma, változtatás nélkül, referenciaként.*

### Vezetői összefoglaló
Egy egyszerű, de bővíthető RESTful API alapú jegykezelő rendszert építünk. A felhasználók hibajegyeket hozhatnak létre, a támogatók (Support) kezelhetik ezeket, az adminisztrátorok pedig a felhasználókat menedzselik. A rendszer felkészített a későbbi Docker alapú konténerizációra.

### Technológiai stack (tervezett)
- Backend: Java 21 (Recordok, új feature-ök)
- Keretrendszer: Spring Boot 3.x
- Adatbázis: PostgreSQL (később Docker konténerben)
- Adatbázis migráció: Flyway vagy Liquibase
- Biztonság: Spring Security + JWT
- Dokumentáció: Swagger / OpenAPI 3

### Architektúra (tervezett)
Rétegzett (Controller-Service-Repository) minta:
1. **Controller Layer**: csak HTTP kéréseket fogad, validál, és meghívja a Service-t. DTO-kat ad vissza, sosem közvetlenül az adatbázis entitásokat.
2. **Service Layer**: itt él az üzleti logika — ki zárhat le egy jegyet, küldünk-e e-mailt.
3. **Repository Layer**: Spring Data JPA, ami a PostgreSQL-lel beszélget.

### Adatmodell (tervezett)

**User**: `id` (UUID vagy Long), `username` (unique), `email` (unique), `password` (hashed), `role` (Enum: USER, SUPPORT, ADMIN)

**Ticket**: `id` (Long, auto-increment), `title` (max 100 char), `description` (Text), `status` (Enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
