# CarbonTrack — Sustainability Analytics & Carbon Emission Monitoring Platform

CarbonTrack is a web-based sustainability platform designed to help users monitor their carbon footprint, record daily activities, calculate associated carbon emissions, and work toward more sustainable habits.

The project combines a React frontend, a Spring Boot backend, and a PostgreSQL database to provide a foundation for carbon emission tracking and sustainability analytics.

## Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Database Migrations](#database-migrations)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Git Branch Workflow](#git-branch-workflow)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)

## Project Overview

CarbonTrack aims to make environmental impact tracking easier by connecting user activity data with emission factors. Users can record activities, view calculated emissions, and use sustainability-oriented features to understand their environmental impact.

The application is organized into three main components:

1. **Frontend:** A React-based user interface for interacting with the platform.
2. **Backend:** A Spring Boot REST API that handles authentication, activity logging, business logic, and emission calculations.
3. **Database:** PostgreSQL for storing users, activities, emission factors, goals, badges, and feedback.

## Objectives

- Provide a centralized platform for carbon footprint monitoring.
- Record and manage user activities.
- Calculate emissions using emission factors.
- Store and retrieve activity and user information.
- Support sustainability goals and progress tracking.
- Provide a foundation for dashboards, analytics, and future recommendations.

## Features

### User Interface

The frontend contains React components and pages for platform interaction, including:

- Login and registration pages.
- Dashboard.
- Activity management.
- Emissions charts.
- Sustainability goals.
- Leaderboard.
- Organisation page.
- Sidebar navigation and statistics cards.

The final availability of each feature depends on its integration with the backend API.

### Backend

The backend is implemented using Java and Spring Boot. Its source includes:

- JWT authentication components.
- Spring Security configuration.
- User and activity entities.
- Activity logging controller and service.
- Emission factor repository.
- Emission calculation service.
- Global exception handling.
- Request DTOs and repository interfaces.

### Database

The database schema is designed to support user management, activity tracking, emission calculations, sustainability goals, badges, and feedback. Flyway is used to manage database migrations.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, HTML, CSS |
| Backend | Java 17, Spring Boot, Spring Web MVC |
| Security | Spring Security, JWT |
| Persistence | Spring Data JPA, Hibernate |
| Database | PostgreSQL |
| Database migrations | Flyway |
| Build tool | Maven |
| Testing | JUnit and Spring Boot testing dependencies |
| Version control | Git and GitHub |

## Project Structure

The repository combines frontend and backend code in one project.

```text
CarbonTrack/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/carbontrack/backend/
│   │   │       ├── auth/
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── dto/
│   │   │       ├── entity/
│   │   │       ├── exception/
│   │   │       ├── repository/
│   │   │       └── service/
│   │   └── resources/
│   │       ├── application.properties
│   │       └── db/migration/
│   └── test/
│       └── java/com/carbontrack/backend/
│
├── pom.xml
└── README.md
```

*Note: This is a representative structure. The actual directory layout may contain additional files or differences.*

## Database Schema

The database schema provided for CarbonTrack defines the following eight tables.

| Table | Purpose |
|---|---|
| `users` | Stores user profiles, credentials, roles, and account status. |
| `activity_types` | Defines activities, categories, units, and descriptions. |
| `emission_factors` | Stores emission values associated with activity types and regions. |
| `activity_logs` | Records user activities and calculated emissions. |
| `user_goals` | Stores emission reduction targets and target periods. |
| `badges` | Defines sustainability achievements and thresholds. |
| `user_badges` | Associates users with earned badges. |
| `feedback` | Stores user feedback and ratings. |

### Relationships

- A user can have multiple activity logs.
- Each activity log references an activity type and a user.
- An activity type can have multiple emission factors.
- A user can define multiple sustainability goals.
- Users can earn multiple badges through the `user_badges` relationship.
- A user can submit feedback.

### Indexes

The supplied schema creates indexes to support queries involving:

- Activity logs by user and date.
- Activity logs by activity type and date.
- Emission factors by activity type and active status.
- Goals by user and active status.
- User badges by user.
- Feedback by user.

### Schema Notes

The supplied `V1__create_schema.sql` uses UUID primary keys and foreign keys. Confirm that these types match the entities and any existing database before applying migrations.

The schema file also contains `BEGIN` and `COMMIT` statements. Verify that its transaction handling is compatible with your Flyway configuration before deployment.

## Backend Architecture

The backend follows a layered structure.

### Controllers

Controllers expose HTTP endpoints and accept incoming requests. The source includes an activity logging controller and an authentication controller.

### Services

Service classes contain application logic, including activity processing and emission calculations.

### Entities

Entities represent persisted domain objects, including users, activity logs, and emission factors.

### Repositories

Repositories provide data access through Spring Data JPA.

### Security

The source includes JWT authentication components and Spring Security configuration. Authentication and authorization behavior should be tested before production use.

## Frontend Architecture

The frontend uses React and Vite.

The main areas include:

- **Authentication:** Login and registration interfaces.
- **Dashboard:** An overview of sustainability information.
- **Activities:** Activity entry and management.
- **Emissions charts:** Visual representation of emissions data.
- **Goals:** Sustainability target management.
- **Leaderboard:** A page for displaying comparative information.
- **Organisation:** An organisation-related interface.

The frontend communicates with the backend through the API utility. Configure the API base URL to match the backend environment.

## Getting Started

### Prerequisites

Install the following software:

- Git.
- Java Development Kit (JDK) 17.
- Maven, or use the project's Maven wrapper if available.
- Node.js and npm.
- PostgreSQL.

### 1. Clone the repository

```bash
git clone https://github.com/Divya11498/CarbonTrack.git
cd CarbonTrack
```

To use the combined branch, check it out explicitly:

```bash
git fetch origin
git switch --track origin/carbontrack-combined
```

If the local branch already exists, use:

```bash
git switch carbontrack-combined
```

### 2. Configure the database

Create a PostgreSQL database for local development. For example:

```sql
CREATE DATABASE carbontrack;
```

Configure the database connection in `src/main/resources/application.properties` or through environment variables, depending on the application's configuration.

Do not commit database passwords, JWT secrets, or other credentials to Git.

### 3. Run the backend

From the repository root:

```bash
mvn clean test
```

If the tests pass, start the Spring Boot application:

```bash
mvn spring-boot:run
```

The actual server port is determined by the application configuration.

### 4. Run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal.

### 5. Connect the frontend to the backend

Check the frontend API utility, such as `frontend/src/api.js`, and configure it to use the backend's actual URL and port.

If the frontend and backend run on different origins, configure the backend's CORS policy appropriately.

## Configuration

The backend requires a valid PostgreSQL connection. A typical configuration includes:

- Database URL.
- Database username.
- Database password.
- JPA configuration.
- Flyway migration configuration.
- JWT secret and token settings, if required by the implementation.

Use environment variables or a local, untracked configuration file for sensitive values.

Example environment variable names:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
```

These are suggested names; ensure they match the variables or property placeholders actually used by the application.

## Database Migrations

Flyway migration files are located in:

```text
src/main/resources/db/migration/
```

Migration filenames follow Flyway's versioned naming convention, for example:

```text
V1__create_schema.sql
V2__seed_reference_data.sql
V3__seed_demo_users.sql
```

The repository may contain additional migrations.

### Migration Guidelines

1. Inspect the Flyway schema history before applying migrations to an existing database.
2. Do not edit a migration that has already been applied to a shared or production database.
3. Create a new versioned migration for subsequent schema changes.
4. Verify foreign key types match their referenced primary keys.
5. Test migrations against a development database before deployment.
6. Back up important data before applying schema changes.

**Important:** The schema provided for `V1__create_schema.sql` uses UUID identifiers. Verify compatibility with the actual database and JPA entities. Do not assume that the migration is safe to run against an existing database without checking its current schema and Flyway history.

## API Overview

The backend source includes authentication and activity-related components.

| Area | Purpose |
|---|---|
| Authentication | Login and registration-related operations |
| Activity logs | Recording and managing user activities |
| Emission calculations | Calculating emissions associated with activity data |
| Emission factors | Accessing emission factor data |
| Security | JWT-based authentication and request security |

Exact HTTP methods, endpoint paths, request fields, and response formats should be confirmed from the controller mappings and DTO definitions. Consult the source code before integrating external clients.

## Testing

Run the backend test suite:

```bash
mvn test
```

The repository includes test classes for activity logging and emission calculation services.

For frontend testing, inspect `frontend/package.json` for the available scripts:

```bash
npm run
```

Before considering the combined project complete, verify:

- Backend compilation.
- Database connectivity.
- Flyway migration execution.
- Authentication and authorization.
- Activity logging and emission calculation.
- Frontend-to-backend communication.
- Frontend build.
- Automated tests.

## Git Branch Workflow

The repository has separate branches for different parts of the project, including:

- `main`
- `frontend`
- `backend-sprint1`
- `database_db`

The combined work is intended to be published on a separate branch named:

- `carbontrack-combined`

The goal is to preserve the existing branches and integrate the code on the new branch.

### Push the combined branch

After resolving merge conflicts, reviewing changes, and committing the merge, run:

```bash
git push -u origin integration:carbontrack-combined
```

This pushes the local `integration` branch to the remote branch `carbontrack-combined`.

Verify the result on GitHub:

https://github.com/Divya11498/CarbonTrack/tree/carbontrack-combined

The remote branch will exist only after the push succeeds. Avoid force-pushing or merging into `main` if the intention is to keep the existing branches unchanged.

## Future Enhancements

Potential improvements include:

- More detailed emissions analytics.
- Personalised emission reduction recommendations.
- Goal progress visualisation.
- Peer or organisation-level benchmarking.
- Expanded automated testing.
- Improved input validation and error reporting.
- Deployment automation and environment-specific configuration.

These are potential enhancements, not claims that the features are already implemented.

## Contributing

1. Create a separate feature branch.
2. Keep changes focused on the intended feature.
3. Test changes locally.
4. Review database migration compatibility.
5. Commit with a descriptive message.
6. Push your branch and open a pull request when appropriate.

## License

Add the project's license information here if a license has been selected.

---

**CarbonTrack — Track your footprint. Understand your impact. Build a more sustainable future.**
