# Time Trackerígena

> Full-stack time tracking, project management, multi-currency cost estimation, and productivity telemetry platform built with layered architecture, zero-friction guest mode, and inclusive accessibility.

[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-blue?style=flat-square&logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.1%20%7C%20Python%203.11+-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy%202.0-red?style=flat-square&logo=sqlalchemy)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-green?style=flat-square)](https://jwt.io/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License MIT](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](LICENSE)

**Language / Idioma:** **English (Current)** | [Versão em Português](README.md)

---

## Executive Summary

1. [Overview & Value Proposition](#overview--value-proposition)
2. [Why Is This Project Relevant?](#why-is-this-project-relevant)
3. [Engineering & Architectural Decisions](#engineering--architectural-decisions)
4. [Architecture Diagram](#architecture-diagram)
5. [Product Features & Usability](#product-features--usability)
6. [Tech Stack & Rationales](#tech-stack--rationales)
7. [How to Run the Project (Quickstart Guide)](#how-to-run-the-project-quickstart-guide)
8. [Environment Variables](#environment-variables)
9. [REST API Specification](#rest-api-specification)
10. [Repository Structure](#repository-structure)
11. [Accessibility (WCAG 2.1 AA) & Design System](#accessibility-wcag-21-aa--design-system)
12. [Security & Production Resilience](#security--production-resilience)

---

## Overview & Value Proposition

**Time Trackerígena** is a full-stack web application conceived to bridge the gap left by generic, one-size-fits-all time-tracking utilities. Engineered specifically for freelancers, independent software engineers, and agile squads, it brings together **real-time time tracking**, **granular project management, multi-currency billing, and budget telemetry**.

The platform solves core operational challenges:
- **Accurate Pricing and Invoicing**: Tasks support dedicated hourly rates in customized currencies (BRL, USD, EUR, GBP), budgeted hour targets, and billable status flags.
- **Uninterrupted Continuous Tracking**: A reactive, draggable floating widget ensures that timer sessions persist uninterrupted across tabs, reports, task managers, and calendars.
- **Zero-Friction Guest Mode**: Evaluators and first-time users can explore 100% of the platform's capabilities instantly in the browser through `sessionStorage` mock persistence—no sign-up, credit card, or active backend required for demo walkthroughs.
- **Inclusive & Universal Accessibility**: Compliant with WCAG 2.1 AA standards, featuring dynamic font zoom, dyslexic-friendly typography, calibrated high-contrast mode, text-to-speech hovering via Web Speech API, and seamless light/dark theme switching.

---

## Why Is This Project Relevant?

From a software engineering evaluation standpoint, this repository demonstrates five key architectural highlights:

### 1. Strict Layered Architecture
The backend decouples HTTP concerns from business logic completely:
**Routes -> Controllers -> Services -> Repositories -> Models -> Schemas**. This promotes independent unit testing, interchangeable persistence engines, and reusable domain logic.

### 2. Transparent Dual Persistence (Local SQLite / Cloud PostgreSQL)
The codebase dynamically adapts to its runtime:
- In **local development**, it self-provisions an isolated relational SQLite database with enforced relational integrity (`PRAGMA foreign_keys = ON`).
- In **production environments (Render / Neon / Supabase)**, it connects to PostgreSQL using intelligent connection pooling (`pool_pre_ping=True`, `pool_recycle=300`), eliminating dropped connection errors (*SSL SYSCALL EOF* caused by serverless idle timeouts).

### 3. Asynchronous Deadline Telemetry & Notifications
An autonomous background daemon thread runs continuously on the backend, periodically scanning active project and task deadlines and triggering transactional SMTP notification emails with automatic port and security protocol fallbacks (587 TLS / 465 SSL).

### 4. Enterprise-Grade Administration & Auditing
Far beyond a simple toy MVP, the platform includes:
- Role-Based Access Control (RBAC) with dedicated admin-only endpoints.
- Granular immutable audit logs (`AuditLog`) for tracing critical mutations.
- Integrated two-way Helpdesk ticketing system.
- Real-time global maintenance mode that can be toggled without redeploying.

### 5. Atomic & Highly Interactive Frontend
Crafted in **React 19** using **Atomic Design principles** (Atoms, Molecules, Organisms, Pages, and Templates). Reordering categories, projects, and tasks is smooth and intuitive using modern drag-and-drop primitives (`@dnd-kit/core` and `@dnd-kit/sortable`).

---

## Engineering & Architectural Decisions

| Decision | Alternative Rejected | Rationale |
| :--- | :--- | :--- |
| **Flask + Marshmallow** | FastAPI / Monolithic Django | Flask delivers high modularity without the bloat of Django's conventions, granting complete control over request lifecycles, security middlewares, and strict declarative validation schemas via Marshmallow. |
| **Atomic Design in React 19** | Flat single-folder structure | Enforces strict reusability of foundational UI components (buttons, badges, inputs), isolating visual styling from top-level state containers. |
| **Hybrid Persistence (SQLite/PostgreSQL)** | Mandatory PostgreSQL container | Enables anyone to clone the repository and run the full stack in seconds with zero external container orchestration or database server setup. |
| **Session-Backed Guest Mock DB** | Bare LocalStorage without schemas | Faithfully mimics API response schemas and latency in memory, allowing friction-free testing without polluting production databases. |
| **Native Web Speech API** | Bulky third-party audio packages | Real-time text-to-speech audio feedback for hovered or focused elements with zero network latency or recurring audio API costs. |
| **@dnd-kit over react-beautiful-dnd** | react-beautiful-dnd (deprecated) | `@dnd-kit` is lightweight, actively maintained, fully compatible with React 19, and offers first-class keyboard navigation and screen reader accessibility. |

---

## Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Frontend (React 19 + Vite)"]
        UI["Atomic Design (Atoms, Molecules, Organisms)"]
        State["Contexts (AuthContext, LanguageContext)"]
        Router["React Router v7"]
        GuestMock["Guest Mode Interceptor (sessionStorage)"]
        APIClient["API Service (Fetch + JWT Auth)"]
    end

    subgraph Gateway ["Security & HTTP Pipeline"]
        CORS["CORS Middleware"]
        SecHeaders["Security Headers (CSP, Frame-Options, nosniff)"]
        JWTFilter["JWT Verification & Role Guard"]
    end

    subgraph Backend ["Backend (Flask 3.1 + Python 3.11+)"]
        Routes["Blueprints REST (/auth, /projects, /tasks, /admin)"]
        Controllers["Controllers (HTTP Serialization & Marshalling)"]
        Services["Business Services (Domain Rules)"]
        Repos["Data Repositories (SQLAlchemy 2.0 ORM)"]
        Schemas["Marshmallow Schemas (Validation & Typing)"]
        Worker["Deadline Notifier (Background Daemon Thread)"]
    end

    subgraph External ["External & Cloud Services"]
        SMTP["SMTP Server (Transactional Alerts)"]
        Supabase["Supabase Storage (Project Attachments)"]
        GA4["Google Analytics 4"]
    end

    subgraph Database ["Data Persistence"]
        SQLite[("Local SQLite (timetracker.db)")]
        Postgres[("Neon / PostgreSQL Cloud")]
    end

    Client -->|Authenticated Requests| Gateway
    Client -.->|Guest Mode (No Token)| GuestMock
    Gateway --> Routes
    Routes --> Controllers
    Controllers --> Schemas
    Controllers --> Services
    Services --> Repos
    Repos --> SQLite
    Repos --> Postgres
    Worker --> Repos
    Worker --> SMTP
    UI -.-> Supabase
    Client -.-> GA4
```

---

## Product Features & Usability

### 1. Dynamic Stopwatches & Floating Mini-Timer
- Start, pause, and log work sessions with second-by-second accuracy.
- Contextual logging with notes and task associations.
- **Floating Mini-Widget**: Keeps your running timer visible and interactive regardless of which view you navigate to.

### 2. Drag-and-Drop Project & Task Management
- Hierarchical grouping: **Category -> Project -> Task -> Time Entry**.
- Fluid drag-and-drop reordering powered by `@dnd-kit`.
- Custom hourly rates and currency assignments per task.
- Full revision log of deadlines and rescheduling history (*Deadline History*).
- Project file uploads and attachments integrated with Supabase Object Storage.

### 3. Intelligent Invoicing & Financial Reports
- Automated revenue estimation based on tracked time and task billable rates.
- Comprehensive history log with faceted filters: date range, category, project, task, and billing status (*Billed* vs *Unbilled*).
- Instant inline editing for past time records.

### 4. Productivity Telemetry & Visual Analytics
- Responsive data visualization built with **Recharts**:
  - Breakdown of tracked time per category (Donut / Pie charts).
  - Time allocation across individual tasks (Bar charts).
  - Workload intensity distribution across days of the week.
  - Key Performance Indicators (Total Tracked Hours, Estimated Revenue, Active Deadlines).

### 5. Calendar Board & Automated Deadline Alerts
- Interactive deadline calendar supporting list and grid overviews.
- Background worker scans the database and notifies users when deliverables are due.

### 6. Comprehensive Admin Console
- User management: inspect accounts, toggle administrative privileges, edit profiles, or revoke access.
- Filterable and clearable audit trail (`AuditLog`) for tracking system events.
- Dynamic maintenance mode banner with non-admin traffic gating.
- Full-featured Helpdesk support ticketing center.

---

## Tech Stack & Rationales

### Frontend
- **React 19**: Modern UI rendering engine taking advantage of concurrent enhancements.
- **Vite 8**: Next-generation bundler delivering near-instant Hot Module Replacement (HMR).
- **React Router 7**: Declarative client-side routing with nested layouts.
- **@dnd-kit**: Modular, accessible drag-and-drop toolkit.
- **Recharts 3**: Highly customizable SVG charting library.
- **Lucide React**: Clean, lightweight SVG icon system.
- **Vanilla CSS**: Native CSS variables and custom properties providing peak rendering speed without CSS runtime overhead.

### Backend
- **Python 3.11+ / Flask 3.1**: Lean, performant, and reliable microframework.
- **SQLAlchemy 2.0**: Next-generation ORM with modern typed queries and relationship management.
- **Marshmallow & Marshmallow-SQLAlchemy**: Strict bidirectional data parsing, schema validation, and error formatting.
- **Flask-JWT-Extended**: Secure stateless token issuance and claim validation.
- **Flask-Mail**: Transactional mailing engine with robust SSL/TLS fallback handling.
- **Bcrypt**: Adaptive salted cryptographic hashing for credentials.
- **Gunicorn 23**: High-concurrency WSGI HTTP server for production.

### Database & Cloud Storage
- **SQLite**: Zero-configuration embedded relational storage for local development.
- **PostgreSQL (Neon / Render / Supabase)**: Production-ready ACID compliant relational database.
- **Supabase**: Cloud object storage for project documentation and attachments.

---

## How to Run the Project (Quickstart Guide)

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **npm** or **yarn** package manager

---

### 1. Clone the Repository
```bash
git clone https://github.com/Filipiss/time-trackerigena.git
cd time-trackerigena
```

---

### 2. Configure & Run Backend (API)

```bash
# 1. Move into the backend directory
cd backend

# 2. Create and activate a virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment configuration
cp .env.example .env
# Edit .env if you wish to configure JWT, SMTP, or PostgreSQL credentials

# 5. (Optional) Populate database with realistic demo data
python seed.py

# 6. Start development server
flask run --debug --port 8000
```
> The API will boot on `http://127.0.0.1:8000`. In local development without a specified `DATABASE_URL`, SQLite auto-provisions `database/timetracker.db`.

---

### 3. Configure & Run Frontend

Open a new terminal window:

```bash
# 1. Move into the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
> The frontend application will be live at `http://localhost:5173`.

---

### Demo Seed Credentials
If you executed `python seed.py`, log in with:
- **Username / Email:** `demo` (or `demo@timetracker.dev`)
- **Password:** `Demo@1234`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required? | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | No | `sqlite:///.../timetracker.db` | PostgreSQL connection string (defaults to local SQLite if omitted) |
| `JWT_SECRET_KEY` | Yes (in prod) | `dev-insecure-key-...` | Secret key used to sign and verify JWT tokens |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed frontend origin for transactional email links |
| `MAIL_SERVER` | No | `smtp.gmail.com` | Outgoing SMTP server address |
| `MAIL_PORT` | No | `587` | SMTP port (587 for TLS / 465 for SSL) |
| `MAIL_USE_TLS` | No | `True` | Enable opportunistic STARTTLS |
| `MAIL_USE_SSL` | No | `False` | Enable direct SSL encryption |
| `MAIL_USERNAME` | No | `youremail@gmail.com` | SMTP user / email authentication |
| `MAIL_PASSWORD` | No | `your-16-char-app-pass` | SMTP account application password |
| `MAIL_DEFAULT_SENDER`| No | `youremail@gmail.com` | Display address for system emails |

### Frontend (`frontend/.env`)

| Variable | Required? | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | No | `http://localhost:8000` | Target URL of the backend Flask API |
| `VITE_SUPABASE_URL` | No | `https://xyz.supabase.co` | Supabase project URL for object storage |
| `VITE_SUPABASE_ANON_KEY` | No | `eyJhbGciOi...` | Supabase public anonymous API key |

---

## REST API Specification

All API endpoints follow REST conventions, returning standard JSON envelopes structured as `{ success: true, data: ... }`.

### Authentication & Profiles (`/api/auth`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Registers a new user account |
| `GET` | `/api/auth/activate` | No | Verifies account using email activation token |
| `POST` | `/api/auth/login` | No | Authenticates user and returns JWT Bearer token |
| `GET` | `/api/auth/me` | Yes | Retrieves profile details of current user |
| `POST` | `/api/auth/forgot-password`| No | Dispatches password reset link via email |
| `POST` | `/api/auth/reset-password` | No | Sets new password using validated reset token |

### Categories (`/api/categories`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/categories/` | Yes | Lists all categories for current user |
| `POST` | `/api/categories/` | Yes | Creates a new category |
| `PUT` | `/api/categories/<id>` | Yes | Updates category name |
| `DELETE` | `/api/categories/<id>` | Yes | Removes category and cascades cleanup |
| `PATCH` | `/api/categories/reorder` | Yes | Updates display sorting order |

### Projects & Attachments (`/api/projects`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/projects/` | Yes | Retrieves projects (filterable by `?category=`) |
| `POST` | `/api/projects/` | Yes | Creates a new project |
| `GET` | `/api/projects/<id>` | Yes | Retrieves detailed project information |
| `PUT` | `/api/projects/<id>` | Yes | Modifies name, status, deadline, and notes |
| `DELETE` | `/api/projects/<id>` | Yes | Deletes project and associated tasks |
| `PATCH` | `/api/projects/reorder` | Yes | Updates projects display order |
| `GET` | `/api/projects/<id>/attachments` | Yes | Lists attachments linked to a project |
| `POST` | `/api/projects/<id>/attachments` | Yes | Attaches a file reference to a project |
| `PATCH` | `/api/projects/<id>/attachments/<att_id>` | Yes | Modifies attachment tag or label |
| `DELETE` | `/api/projects/attachments/<att_id>` | Yes | Deletes an attachment |

### Tasks (`/api/tasks`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/tasks/` | Yes | Lists tasks (filters: `category`, `project_id`) |
| `POST` | `/api/tasks/` | Yes | Creates new task with rates, color, and budget |
| `GET` | `/api/tasks/<id>` | Yes | Retrieves specific task details |
| `PUT` | `/api/tasks/<id>` | Yes | Updates task and records deadline history |
| `DELETE` | `/api/tasks/<id>` | Yes | Removes task and logged entries |
| `PATCH` | `/api/tasks/reorder` | Yes | Updates tasks sorting order |

### Time Tracking & Statistics (`/api/time-entries`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/time-entries/` | Yes | Retrieves entries (filters: `task_id`, `category`, `limit`, dates) |
| `POST` | `/api/time-entries/` | Yes | Records a completed time tracking session |
| `PUT` | `/api/time-entries/<id>` | Yes | Updates timestamps, duration, or notes |
| `DELETE` | `/api/time-entries/<id>` | Yes | Removes a logged time entry |
| `GET` | `/api/time-entries/stats` | Yes | Computes aggregations by category, task, and weekday |

### Calendar Events (`/api/calendar_events`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/calendar_events/` | Yes | Lists upcoming calendar deadlines and events |
| `POST` | `/api/calendar_events/` | Yes | Registers a custom calendar deadline |
| `PUT` | `/api/calendar_events/<id>`| Yes | Modifies event dates or status |
| `DELETE` | `/api/calendar_events/<id>`| Yes | Removes an event from the calendar |

### Support Ticketing (`/api/support`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/support` | Yes | Opens a new support ticket |
| `GET` | `/api/support` | Yes | Lists all tickets filed by user |
| `GET` | `/api/support/<id>/messages` | Yes | Fetches ticket conversation history |
| `POST` | `/api/support/<id>/messages` | Yes | Sends a reply message to ticket thread |

### Admin Console (`/api/admin`)
| Method | Endpoint | Auth Required? | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/users` | Admin | Lists all registered platform users |
| `POST` | `/api/admin/users` | Admin | Administratively provisions a new user |
| `PUT` | `/api/admin/users/<id>` | Admin | Modifies account profile data |
| `PUT` | `/api/admin/users/<id>/role` | Admin | Grants or revokes administrator privileges |
| `DELETE` | `/api/admin/users/<id>` | Admin | Permanently deletes a user account |
| `GET` | `/api/admin/metrics` | Admin | Returns system-wide telemetry and stats |
| `GET` | `/api/admin/logs` | Admin | Fetches paginated audit logs |
| `DELETE` | `/api/admin/logs/<id>` | Admin | Deletes an individual audit record |
| `POST` | `/api/admin/logs/delete-bulk` | Admin | Deletes multiple audit log entries |
| `DELETE` | `/api/admin/logs/clear` | Admin | Clears all stored audit logs |
| `GET` | `/api/admin/support` | Admin | Inspects all support tickets across all users |
| `PUT` | `/api/admin/support/<id>/status`| Admin | Changes ticket state (Open, In Progress, Resolved) |
| `DELETE` | `/api/admin/support/<id>` | Admin | Deletes a support ticket |

---

## Repository Structure

```text
time-trackerigena/
├── backend/
│   ├── controllers/          # HTTP request handlers & response formatting
│   ├── docs/                 # Additional technical API notes
│   ├── models/               # SQLAlchemy 2.0 declarative database entities
│   ├── repositories/         # Database access and query abstraction layer
│   ├── routes/               # Flask Blueprints registration
│   ├── schemas/              # Marshmallow serialization & validation schemas
│   ├── services/             # Core business rules, pricing logic & orchestration
│   ├── utils/                # DB setup, audit logging, mailer & deadline notifier
│   ├── .env.example          # Environment variable template
│   ├── app.py                # WSGI entrypoint for production servers
│   ├── main.py               # Flask application factory and core routing
│   ├── requirements.txt      # Python runtime dependencies
│   └── seed.py               # Demonstration data population script
│
├── frontend/
│   ├── src/
│   │   ├── assets/           # Static icons, logos, and global graphics
│   │   ├── components/
│   │   │   ├── atoms/        # Badge, Button, ColorDot, Input, Select, Spinner
│   │   │   ├── molecules/    # StatCard, TaskCard, NavItem, UserWidget, TabButton
│   │   │   ├── organisms/    # TimerWidget, CalendarBoard, BillingTable, Modals
│   │   │   ├── pages/        # TimerPage, TasksPage, DashboardPage, AdminPages
│   │   │   └── templates/    # MainLayout, AdminLayout
│   │   ├── contexts/         # AuthContext (JWT) and LanguageContext (i18n)
│   │   ├── utils/            # GuestMock, currency helpers, date & password utils
│   │   ├── api.js            # Unified API client with automatic Guest interceptor
│   │   ├── App.jsx           # Main routing tree and global provider setup
│   │   └── main.jsx          # React DOM entry point
│   ├── package.json          # Frontend build dependencies & scripts
│   └── vite.config.js        # Vite bundler configuration
│
├── database/                 # Local SQLite database destination folder
├── render.yaml               # Infrastructure-as-code blueprint for Render Cloud
├── README.md                 # Primary documentation (Portuguese)
└── README_EN.md              # Complete English documentation
```

---

## Accessibility (WCAG 2.1 AA) & Design System

Accessibility was implemented as a **first-class non-functional requirement** rather than an afterthought:

- **Floating Accessibility Dock**: Instant one-click visual adaptation controls available anywhere in the interface.
- **Screen Reader via Web Speech API**: Interactive real-time audio narration for UI elements receiving keyboard focus or cursor hover.
- **Dyslexia-Friendly Typography**: Dynamic font toggling to reduce glyph confusion for dyslexic readers.
- **Dynamic Scale Adjustment**: Relative typographic zoom controls preventing UI breakage or horizontal scrollbars.
- **Calibrated High Contrast**: Strict compliance with WCAG 2.1 AA 4.5:1 contrast ratio thresholds.
- **Light & Dark Theme Engine**: Harmonious color palettes with persistent preference storage in `localStorage`.

---

## Security & Production Resilience

- **OWASP-Compliant Security Headers**: Automated response header injection:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
- **Resilient Connection Pooling**: Built with `pool_pre_ping=True` and `pool_recycle=300` in SQLAlchemy, protecting against connection dropouts common in serverless database architectures.
- **Cryptographic Password Security**: Bcrypt with dynamic salts and adaptive cost factor.
- **Traceable Action Audit**: High-impact administrative and financial operations automatically populate `AuditLog`.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.
