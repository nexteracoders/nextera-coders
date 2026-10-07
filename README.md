# NextEra Coders Learning Platform

> **Product:** NextEra Coders  
> **Brand:** NextEra Coders  
> **Tagline:** *Learn. Code. Build. Grow.*  
> **Status:** Production Ready (Phases 1 — 10 Complete)

---

## 🚀 Platform Overview

**NextEra Coders Learning** is an enterprise-grade, high-performance full-stack educational ecosystem engineered for ambitious developers and engineers. The platform combines interactive structured learning, data structures and algorithms practice with sandboxed code execution, skill-testing assessments, real-world portfolio project blueprints, interactive markdown tutorials, verifiable cryptographic certificates, gamification economics, and a self-governing administrative Content Management System (CMS).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                   NEXTERA CODERS LEARNING                   │
   │               "Learn. Code. Build. Grow."                   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      │                                                       │
┌─────▼─────────────────────────┐           ┌─────────────────▼─────────────┐
│       STUDENT PLATFORM        │           │        ADMIN CMS SUITE        │
│                               │           │                               │
│ • Interactive Video Player    │           │ • Live KPIs & Aggregations    │
│ • Curriculum Bookmarking      │           │ • 30-Day Trend Analytics      │
│ • Sandboxed Code Editor & DSA │           │ • Cross-Course Curriculum CMS │
│ • Automated Quiz Evaluations  │           │ • DSA & Test-Case Management  │
│ • Project Blueprints & Demos  │           │ • Gamification & Badge Editor │
│ • Verifiable Certificates     │           │ • Announcements & Broadcast   │
│ • XP & Daily Streak Engine    │           │ • Student Dossier & Mod Tools │
│ • In-App Notification Center  │           │ • Immutable Security Audit Log│
└───────────────────────────────┘           └───────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend Client (`client/`)
- **Framework & Build:** React 18 with Vite 6
- **Language:** TypeScript 5.7+ (Strict Mode)
- **Styling:** Tailwind CSS with custom design system, light/dark mode class strategy
- **Routing & Optimization:** React Router v7 with route-level `React.lazy()`, `Suspense`, and `ErrorBoundary`
- **State Management:** Redux Toolkit & React-Redux (`authSlice`, `themeSlice`)
- **HTTP Client:** Axios (configured with `withCredentials: true`, interceptors, safe error formatting)
- **Form & Validation:** React Hook Form & Zod
- **Visuals & Charts:** Recharts for admin analytics and student engagement metrics
- **Icons & Motion:** Lucide React & Framer Motion

### Backend Server (`server/`)
- **Runtime:** Node.js (v20+ / v22+ LTS)
- **Framework:** Express.js with TypeScript
- **Security & Headers:** Helmet, CORS (origin verification), Rate Limiting (`express-rate-limit`), HTTP-Only cookie tokens, bcryptjs (12 hashing rounds)
- **Database Layer:** MongoDB with Mongoose ORM (Compound & text search indexes, lean queries)
- **Code Execution:** Isolated child process sandbox runner with CPU/memory limits, stripped environment, and strict timeout protection
- **Logging & Lifecycle:** Structured application logger, Morgan HTTP logger, and graceful `SIGTERM`/`SIGINT` shutdown handlers

---

## 🧭 Core Architectural Flows

### 1. The Student Learning Journey
```
  DISCOVER        LEARN          PRACTICE         TEST           BUILD           TRACK          CERTIFY
┌──────────┐   ┌──────────┐   ┌────────────┐   ┌─────────┐   ┌────────────┐   ┌─────────┐   ┌────────────┐
│ Browse   ├──►│ Interactive  ├──►│ Sandboxed  ├──►│ Quizzes ├──►│ Real-World ├──►│ XP &    ├──►│ Issue &    │
│ Courses  │   │ Video    │   │ Code       │   │ & Tests │   │ Projects   │   │ Streaks │   │ Verify     │
│ & Tracks │   │ Lessons  │   │ Runner     │   │ Engine  │   │ Blueprints │   │ Profile │   │ Credential │
└──────────┘   └──────────┘   └────────────┘   └─────────┘   └────────────┘   └─────────┘   └────────────┘
```

### 2. The Admin Governance Cycle
```
  CREATE         AUTHOR          TEST           PUBLISH        MONITOR        MODERATE
┌──────────┐   ┌──────────┐   ┌────────────┐   ┌─────────┐   ┌────────────┐   ┌─────────┐
│ Draft    ├──►│ Modules, ├──►│ Run Cases  ├──►│ MongoDB ├──►│ Real-Time  ├──►│ Student │
│ Content  │   │ Lessons  │   │ & Previews │   │ & State │   │ Analytics  │   │ Dossiers│
│ Track    │   │ & Quizzes│   │            │   │ Dynamic │   │ & KPIs     │   │ & Logs  │
└──────────┘   └──────────┘   └────────────┘   └─────────┘   └────────────┘   └─────────┘
```

---

## 📁 Repository Directory Structure

```
next-era-coders-learning/
├── client/                               # Frontend React + Vite SPA
│   ├── public/                           # Static assets (robots.txt, sitemap.xml, _redirects)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                    # AdminDataTable, StatusBadge, PageHeader, GlobalSearchModal
│   │   │   ├── code/                     # Monaco-style CodeEditor, ConsoleOutput
│   │   │   ├── common/                   # Header, Footer, ErrorBoundary, PageLoader, ThemeToggle
│   │   │   ├── learning/                 # VideoPlayer, LessonNotes, LessonNavigation
│   │   │   └── ui/                       # Reusable Button, Card, Modal, Dropdown, Skeleton, Spinner
│   │   ├── constants/                    # Routes, navigation, categories
│   │   ├── layouts/                      # PublicLayout, StudentLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── admin/                    # Complete Admin CMS (Dashboard, Analytics, Courses, Students, etc.)
│   │   │   ├── public/                   # Home, Courses, DSA, Practice, Projects, Tutorials, About, Auth
│   │   │   └── student/                  # Dashboard, MyLearning, Certificates, Achievements, Profile
│   │   ├── routes/                       # AppRoutes (lazy loaded), ProtectedRoute, RoleRoute
│   │   ├── services/                     # Typed Axios API client services
│   │   └── types/                        # Comprehensive TypeScript type definitions
│   └── vercel.json                       # SPA route fallback for Vercel deployment
│
├── server/                               # Backend Express + Node.js API
│   ├── src/
│   │   ├── config/                       # Environment variables, database connection, seed runner
│   │   ├── controllers/                  # Auth, Admin, Course, DSA, Quiz, Certificate, Gamification
│   │   ├── middleware/                   # Auth & RBAC guards, Rate Limiter, Error Handler, Validator
│   │   ├── models/                       # 18 Mongoose Schemas (User, Course, Problem, AuditLog, etc.)
│   │   ├── routes/                       # Modular Express Routers
│   │   ├── services/                     # Code Execution Sandbox, Certificates, Gamification, Audit
│   │   ├── utils/                        # ApiError, ApiResponse, Logger, Certificate generator
│   │   └── validators/                   # Zod request validation schemas
│   ├── Dockerfile                        # Multi-stage production container definition
│   └── .dockerignore
│
├── docker-compose.yml                    # Local multi-container orchestration
├── package.json                          # Monorepo root scripts
├── test-phase10.js                       # Master production verification test suite
└── README.md
```

---

## ⚡ Getting Started (Local Development)

### 1. Prerequisites
- **Node.js:** v20.x or v22.x LTS
- **npm:** v10+
- **MongoDB:** Local instance on port 27017 or MongoDB Atlas connection string

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/nexteracoders/next-era-coders-learning.git
cd next-era-coders-learning

# Install dependencies across root, server, and client
npm run install:all
```

### 3. Environment Variables Setup
Create `.env` in `server/`:
```bash
cp server/.env.example server/.env
```
*(Optionally review `client/.env.example` if pointing to an external API origin)*

### 4. Database Initialization & Seeding
```bash
# Seed initial courses, DSA challenges, quizzes, badges, announcements, and demo users
npm run seed
```

**Pre-Configured Seed Accounts (Development Only):**
- **Admin Account:** `admin@nexteracoders.com` / `Admin@NextEra2026!`
- **Student Account:** `student@nexteracoders.com` / `Student@NextEra2026!`

### 5. Start Development Environment
```bash
npm run dev
```
- Frontend application runs on: `http://localhost:5173`
- Backend API server runs on: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

---

## 🧪 Testing & Verification

Run the comprehensive type checks, builds, and end-to-end automated test suites:

```bash
# 1. Type check client & server
npm run type-check

# 2. Build production assets
npm run build

# 3. Execute Master Production Verification Test Suite
node test-phase10.js
```

---

## 🐳 Docker Deployment

### Run Complete Stack with Docker Compose
```bash
docker-compose up --build -d
```
This provisions:
- `api`: Node.js Express server on port 5000 with health checking
- `mongo`: MongoDB 7.0 database service with volume persistence

---

## ☁️ Cloud Production Deployment Guide

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. **Root Directory:** `client`
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Environment Variables:** `VITE_API_BASE_URL=https://api.yourdomain.com/api`
5. **SPA Deep Linking:** Pre-configured via `client/vercel.json` and `client/public/_redirects`.

### Backend Deployment (Render / Railway / AWS ECS / DigitalOcean)
1. **Root Directory:** `server`
2. **Build Command:** `npm run build`
3. **Start Command:** `node dist/server.js`
4. **Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=5000`
   - `CLIENT_URL=https://yourdomain.com`
   - `SERVER_URL=https://api.yourdomain.com`
   - `DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/nextera_coders?retryWrites=true&w=majority`
   - `JWT_SECRET=<32+ Character High Entropy Secret>`
5. **Health Check Path:** `/api/health`

### MongoDB Atlas Setup
1. Create a dedicated MongoDB M0/M10 Cluster.
2. Under **Network Access**, allow your backend server IP (or `0.0.0.0/0` with secure credentials).
3. Under **Database Access**, create a user with `readWriteAnyDatabase` permissions.
4. Copy the connection URI into `DATABASE_URL`.
5. Run `npm run seed` once to initialize collections and compound indexes.

---

## 🔒 Security Architecture Highlights

| Layer | Implementation | Security Benefit |
| :--- | :--- | :--- |
| **Authentication** | HTTP-Only Cookies + JWT | Prevents client-side XSS token theft |
| **Authorization** | Strict Server-Side Role Middleware | Blocks unauthorized API escalation (`403 Forbidden`) |
| **Password Security** | bcryptjs (12 salt rounds) | Protected against dictionary & rainbow table attacks |
| **Rate Limiting** | `express-rate-limit` | Protects auth endpoints, code runs, and public APIs |
| **Code Runner** | Isolated child processes | Zero main-process execution; memory/CPU/timeout limits |
| **Database Safety** | Mongoose schema validation & sanitization | Protects against NoSQL operator injection |
| **Audit Logs** | Immutable administrative collection | Tracks content creation, edits, and moderation |

---

## 📄 License & Brand Notice

© 2026 **NextEra Coders**. All rights reserved.  
*NextEra Coders Learning — Learn. Code. Build. Grow.*
