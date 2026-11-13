# CarbonTrack — Personal & Enterprise Carbon Footprint & Sustainability Platform

CarbonTrack is a full-stack web platform for tracking daily carbon-producing activities, computing CO₂e emissions from configurable regional emission factors, visualizing time-series analytics, managing reduction goals & gamified achievements, collaborating across multi-tenant organizations, and getting personalized sustainability guidance powered by Google Gemini AI.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Java 17, Spring Boot 4.1.1, Spring Security (Stateless JWT + Google OAuth2), Spring Data JPA, Spring Cache (Redis with automatic in-memory fallback), Spring Mail, Springdoc OpenAPI / Swagger UI 3 |
| **Database & Migrations** | PostgreSQL 18, Flyway (`V1` through `V9`) |
| **Frontend** | React 19, Vite 8, Recharts 3, Lucide Icons, Custom CSS Design System (Earth-tone Light Theme & Dark Theme, 320px–1920px responsive) |
| **AI & Identity** | Google Gemini API (`gemini-2.5-flash` / `gemini-2.0-flash`), Google OAuth2, Blobatar deterministic SVG/PNG avatars |
| **Containers & DevOps** | Multi-stage Dockerfiles (Maven/JDK 17 + Node 22/Nginx), Docker Compose (PostgreSQL + Redis + Backend + Frontend) |

---

## Core Modules & Features

- **Activity Logging & Emission Calculation (`/api/activities`, `/api/emission-factors`)**
  - Supports Transport, Electricity, Food, Shopping, and Waste categories backed by database emission factors.
  - Real-time CO₂e calculation preview, frequent-activity quick-log carousel, and Admin emission-factor inspection/management.
- **Analytics & Benchmarks (`/api/analytics`)**
  - Filterable across `today`, `7d`, `30d`, `this_month`, `prev_month`, and `custom` date ranges.
  - Cumulative vs target budget trend, weekly WoW comparison, 6-month historical trajectory, category share breakdown, top emitting activities, sustainability score (`0–100`), community benchmark comparison, and exportable benchmark reports.
- **Goals & Projections (`/api/goals`)**
  - Custom `startDate`/`endDate` windows, target CO₂e caps, optional reduction percentage + baseline tracking, daily remaining carbon budget, linear trend projection, and `ACTIVE` / `ACHIEVED` / `MISSED` status lifecycle.
- **Event-Driven Achievements (`/api/badges/mine`)**
  - Domain events (`ActivityLoggedEvent`, `GoalUpdatedEvent`) automatically evaluate streaks (e.g., 7-day logging streak), activity milestones, `first_goal_achieved`, and `10kg` / `25kg` / `50kg` reduction badges with progress tracking.
- **AI Sustainability Coach & Recommendations (`/api/recommendations`, `/api/ai/chat`)**
  - Generates personalized, actionable recommendations across 6 sustainability categories (`Energy Optimization`, `Transportation`, `Waste Management`, `Water Conservation`, `Carbon Reduction`, `Sustainability Goals`) with estimated CO₂e savings and status tracking.
  - Context-aware Gemini AI Coach drawer grounded in user logs, active goals, and database emission factors.
- **Organization Workspace & Community Leaderboard (`/api/organizations`, `/api/leaderboard`)**
  - Multi-tenant organization management (create/edit/delete workspace, department breakdown, member roles `OWNER`/`ADMIN`/`MEMBER`, invitation links, category/monthly Recharts visualizations, paginated member table).
  - Top-50 community leaderboard with period filters, percentile ranking, earned badges count, optional anonymization, and personalized habit tips.
- **Notifications & API Documentation (`/api/notifications`, `/swagger-ui.html`)**
  - Responsive HTML email templates for welcome, password reset, goal achieved, goal budget alert, badge earned, and weekly summaries with `notification_logs` deduplication and safe diagnostic fallback when SMTP is not configured.
  - Interactive Swagger UI at `/swagger-ui.html` and OpenAPI JSON at `/v3/api-docs`.

---

## Environment Configuration

Configure environment variables via a local `.env` file (never commit `.env` or credentials to Git):

```env
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/carbontracker
SPRING_DATASOURCE_USERNAME=postgres
DB_PASSWORD=your_postgres_password

# Security & OAuth2
JWT_SECRET=your_base64_or_long_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Redis Cache (optional — automatically falls back to in-memory cache if Redis is down)
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP Mail (optional — logs diagnostics safely if omitted)
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=no-reply@carbontrack.local
FRONTEND_URL=http://localhost:5173

# Frontend build-time config (frontend/.env)
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## Running Locally

### 1. Run Backend (Spring Boot)
```bash
./mvnw spring-boot:run
```
Backend starts on `http://localhost:8080` and runs Flyway migrations `V1`–`V9` on startup.

### 2. Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend starts on `http://localhost:5173`.

### 3. Run via Docker Compose
```bash
docker compose up --build
```
Services started:
- **PostgreSQL 18** (`localhost:5432`)
- **Redis 7** (`localhost:6379`)
- **Backend API** (`http://localhost:8080`)
- **Frontend (Nginx)** (`http://localhost:80`)

---

## Verification & Testing Commands

```bash
# Backend JUnit 5 + Mockito + MockMvc tests
./mvnw test

# Frontend production build & ESLint verification
npm --prefix frontend run build
npm --prefix frontend run lint
```
