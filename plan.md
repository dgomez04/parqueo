# Sprint 1 Plan – Parking Project (English Version)

## Sprint Goal  
Deliver an **initial MVP** covering system foundations: basic authentication, initial user and vehicle management, and the first interface for security officers. This ensures critical flows start functioning early.  

---

## 1. User Stories for Sprint 1
- **Basic Authentication**  
  - *As a user (Admin, Officer, Student, or Staff), I want to log in with username and password so I can access my role-based functionalities.*  
  - **Acceptance criteria**: login validation, default password “Ulacit123”, forced password change on first login.  

- **User Management (Admin)**  
  - *As an administrator, I want to register users with mandatory fields (name, email, birthdate, ID, role) so they can access the system*. 
- **Vehicle Management**  
  - *As an administrator, I want to register vehicles linked to users with details (brand, color, plate, type, owner, special parking flag), so access control can be enforced*  

- **Vehicle Entry (partial flow for MVP)**  
  - *As a security officer, I want to input a vehicle plate and see a traffic-light style indicator if it can enter or not.*  
  - **Note**: For this sprint, validation only checks if vehicle is registered and active (not yet parking availability) 

---

## 2. Technical Deliverables for Sprint 1
- Initial relational model: tables for users, roles, vehicles, and credentials.  
- Initial class diagram: entities User, Vehicle, Role.  
- First functional module: login and CRUD for users/vehicles.  
- Basic system log: records for login attempts and vehicle registrations.  
- Unit tests: covering authentication and user registration.  

---

## 3. Specific Tasks
- Repository setup and Jira board configuration.  
- Database schema design (users, roles, vehicles).  
- Login and password management implementation.  
- CRUD development for users and vehicles.  
- Initial officer interface (vehicle entry plate input + traffic light indicator).  
- Functional test documentation.  
- Updates to backlog, class diagram, and user stories.  

---

## 4. Sprint Acceptance Criteria
- Users can log in and change the default password.  
- Admin can register users and vehicles.  
- Officer can simulate a vehicle entry and see green/red traffic light depending on registration status.  
- Functional tests and deliverables available in Jira.  