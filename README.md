# ✏️ The EyeShades Studio — Full-Stack Pencil Portrait Platform

The official full-stack web application for **The EyeShades Studio** by artist **Netra Puranik** (`@the.eyepuranik` / `~ Netra A.P.`).

Built with **Java Spring Boot 3**, **Spring Data JPA**, **REST API Architecture**, **H2 / PostgreSQL / Supabase Database**, and a responsive frontend with pure graphite & pencil shade art direction.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────┐
│             FRONTEND LAYER (Browser UI)                │
│  - HTML5 / CSS3 (Graphite & Fine-Paper Design System)  │
│  - Vanilla JavaScript Client (api.js & app.js)         │
│  - Real-Time Budget Calculator (₹550 - ₹1,200 INR)     │
│  - Drag & Drop Reference Photo Uploader                │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST JSON
┌──────────────────────────▼─────────────────────────────┐
│          BACKEND LAYER (Java Spring Boot 3)            │
│  - Spring Web MVC (@RestController, CORS Config)       │
│  - Spring Validation (@Valid, Custom DTOs)             │
│  - Service Layer (ArtworkService, CommissionService)   │
│  - Spring Data JPA (ArtworkRepository, CommissionRepo) │
└──────────────────────────┬─────────────────────────────┘
                           │ JDBC / Hibernate ORM
┌──────────────────────────▼─────────────────────────────┐
│                 DATABASE LAYER                         │
│  - Local Dev: Embedded H2 Database (File/In-Memory)    │
│  - Cloud Prod: PostgreSQL (Supabase / Neon / Render)   │
│  - Automatic Schema Migration & Seed Data (SQL Scripts)│
└────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema (Entity-Relationship)

### 1. `artworks` Table
Stores showcase portrait artworks, materials, drawing hours, and appreciation counters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | Unique artwork code (e.g., `eye-001`) |
| `title` | `VARCHAR(200)` | `NOT NULL` | Artwork display title |
| `signature` | `VARCHAR(150)` | | Artist signature tag |
| `category` | `VARCHAR(100)` | `NOT NULL` | Female Portraits, Celebrity, Studies |
| `medium` | `VARCHAR(255)` | | Graphite grades & charcoal specs |
| `paper` | `VARCHAR(150)` | | Drawing paper type (e.g., Bristol A3) |
| `dimensions` | `VARCHAR(100)` | | Physical dimensions (A4, A3) |
| `hours_invested` | `VARCHAR(50)` | | Time spent shading (e.g., 18 Hours) |
| `artwork_year` | `VARCHAR(20)` | | Year created |
| `price` | `VARCHAR(100)` | | Display pricing string |
| `lore` | `TEXT` | | Artistic description & technique lore |
| `image_url` | `VARCHAR(500)` | | Path to high-resolution sketch |
| `thumbnail_url` | `VARCHAR(500)` | | Path to card thumbnail |
| `featured` | `BOOLEAN` | | Featured on homepage banner |
| `likes` | `INT` | `DEFAULT 0` | Collector appreciation counter |

### 2. `artwork_pencils` Table
Collection table storing specific pencil grades used per artwork (`HB`, `2B`, `4B`, `6B`, `8B`, `Charcoal`, `Mono Zero Eraser`).

### 3. `commissions` Table
Stores customer portrait bookings, framing selections, budget calculations, and live workflow status.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | Unique studio tracking code (e.g., `#EYE-7824`) |
| `client_name` | `VARCHAR(150)` | `NOT NULL` | Client / Collector name |
| `email` | `VARCHAR(150)` | `NOT NULL` | Contact email for sketch reviews |
| `tier_title` | `VARCHAR(150)` | `NOT NULL` | A4 Solo, A3 Solo, A3 Couple, A3 Detailed |
| `tier_code` | `VARCHAR(50)` | | Internal tier identifier |
| `framing_option` | `VARCHAR(100)` | | `With Wooden Frame & Glass` / `Without Frame` |
| `rush_delivery` | `BOOLEAN` | `DEFAULT FALSE` | Priority 4-5 day turnaround |
| `shading_depth` | `VARCHAR(100)` | | Soft Graphite, Charcoal Contrast, Vignette Halo |
| `estimated_budget` | `INT` | | Total price in INR (`₹550` – `₹1,200`) |
| `brief` | `TEXT` | | Client's custom instructions / notes |
| `status` | `VARCHAR(50)` | `DEFAULT 'Queued'` | `Queued`, `In Progress`, `Review`, `Completed` |
| `progress` | `INT` | `DEFAULT 5` | Drawing progress percentage (`0` – `100%`) |
| `estimated_delivery`| `VARCHAR(50)` | | Target dispatch date string |
| `order_date` | `DATE` | | Order registration date |
| `created_at` | `TIMESTAMP` | | Timestamp of creation |

---

## 🔌 REST API Specification

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/portraits` | Get all artworks with optional filter | `?category=Female Portraits` |
| `GET` | `/api/v1/portraits/{id}` | Get single artwork details by ID | — |
| `POST` | `/api/v1/portraits/{id}/like` | Increment artwork appreciation count | — |
| `POST` | `/api/v1/commissions` | Register a new portrait booking | JSON payload (see below) |
| `GET` | `/api/v1/commissions/queue` | Get live studio queue counts & orders | — |
| `GET` | `/api/v1/commissions/{code}` | Lookup order status by tracking ID | e.g., `/api/v1/commissions/EYE-7821` |

### Sample Commission Request (`POST /api/v1/commissions`)
```json
{
  "clientName": "Aditi Sharma",
  "email": "aditi@example.com",
  "tierTitle": "A3 Detailed Solo",
  "tierCode": "tier-a3-solo",
  "framingOption": "With Wooden Frame & Glass",
  "rushDelivery": false,
  "shadingDepth": "pure-graphite",
  "estimatedBudget": 950,
  "brief": "Birthday gift portrait from graduation photo. Please focus on eyes and natural smile."
}
```

---

## 🚀 How to Run Locally

### Option 1: Double-Click Batch File (Windows)
Double-click [`run-backend.bat`](file:///c:/Users/Lenovo/OneDrive/Desktop/Desktop_files/Java/run-backend.bat) in the project root.

### Option 2: Run via Terminal / Maven
```bash
mvn clean spring-boot:run
```

Once started:
- 🌐 **Web App & Portfolio**: [http://localhost:8080](http://localhost:8080)
- 📊 **H2 Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
  - JDBC URL: `jdbc:h2:file:./data/eyeshadesdb`
  - Username: `sa`
  - Password: *(leave blank)*

---

## ☁️ Connecting to Supabase / PostgreSQL Database

1. Create a free PostgreSQL database on [Supabase](https://supabase.com).
2. Go to **Project Settings** → **Database** → copy the connection string.
3. Open [`src/main/resources/application-prod.properties`](file:///c:/Users/Lenovo/OneDrive/Desktop/Desktop_files/Java/src/main/resources/application-prod.properties) and update:
   ```properties
   spring.datasource.url=jdbc:postgresql://db.your-project.supabase.co:5432/postgres
   spring.datasource.username=postgres
   spring.datasource.password=your-supabase-password
   ```
4. Run with production profile:
   ```bash
   java -jar target/eyeshades-backend-1.0.0.jar --spring.profiles.active=prod
   ```

 will automatically compile your Java code, connect to your Supabase PostgreSQL database, and provide a live public HTTPS URL (e.g. `https://eyeshades-studio.onrender.com`).
