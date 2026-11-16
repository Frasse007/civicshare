# CivicShare

**A neighborhood tool & equipment lending library.** Borrow tools from your neighbors instead of buying or renting them.

- **Live app:** https://civicshare.vercel.app/
- **Repository:** https://github.com/Frasse007/civicshare
- **Jira:** https://northpark-team-rop9vwu2.atlassian.net/jira/software/projects/FPC/summary?atlOrigin=eyJpIjoiMTk0NTcyZTUyNjNiNDBmNTk1ODU3MWNhYjcxYjQzOTMiLCJwIjoiaiJ9

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Architecture & Design Decisions](#architecture--design-decisions)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Screenshots](#screenshots)
12. [Troubleshooting](#troubleshooting)
13. [Known Limitations](#known-limitations)
14. [Future Enhancements](#future-enhancements)

---

## Overview

Most households own tools they use a few times a year (ladders, pressure washers, saws). CivicShare lets a neighborhood pool that equipment in a shared catalog. Members can browse and search the inventory, check each tool's condition, safety rating and pickup station, see a 7-day weather forecast for the pickup location, and download a printable safety sheet. Admins (inventory managers) can add tools and change their availability.

This MVP covers the Sprint 1 user stories: account registration/login, a searchable and filterable catalog, tool detail pages with safety documentation and weather, and admin inventory management.

![CivicShare landing page](docs/screenshots/home-desktop.png)

## Features

- **Authentication:** register, log in and log out. Sessions use a JWT stored in an HTTP-only cookie, so the SPA never touches the token.
- **Role-based access:** `member` and `admin` roles, with deny-by-default admin routes.
- **Catalog:** full-text search over name and description; filter by category, condition, status and minimum safety rating; sort by name, safety or newest; server-side pagination.
- **Tool detail page:** condition, safety rating, availability badge, pickup station, safety gear and operating guidelines.
- **Weather forecast:** 7-day forecast for a tool's pickup station via the free [Open-Meteo](https://open-meteo.com/) API (no key needed), shown for weather-sensitive tools.
- **Downloadable safety sheet:** plain-text, printable safety documentation for each tool.
- **Admin inventory controls:** create tools and update status (`available`, `borrowed`, `maintenance`).
- **Input safety:** schema validation (Zod), body sanitization, rate-limited auth endpoints, Helmet headers and strict CORS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 8 |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL via Sequelize ORM |
| Validation | Zod |
| Auth & security | bcryptjs, jsonwebtoken, Helmet, CORS, express-rate-limit |
| Testing | Vitest, Supertest (backend); Vitest, Testing Library, jsdom (frontend) |
| Tooling | ESLint |
| Hosting | Vercel (frontend and backend as services in one project) |

## Project Structure

```
civicshare/
├── backend/
│   ├── src/
│   │   ├── config/        # env.js (validated config), database.js (Sequelize)
│   │   ├── routes/        # URL → controller wiring, middleware chains
│   │   ├── controllers/   # HTTP layer: parse request, call service, send response
│   │   ├── services/      # Business logic (search, auth, tool mutations)
│   │   ├── models/        # Sequelize models: User, Tool
│   │   ├── validators/    # Zod schemas for bodies, params and queries
│   │   ├── middleware/    # auth, validate, sanitize, errorHandler
│   │   ├── utils/         # AppError, token helpers
│   │   ├── seeds/         # Demo users and tools
│   │   ├── db/            # init-db.js
│   │   ├── app.js         # createApp() factory
│   │   └── server.js      # Process entry point
│   └── tests/             # unit/ and integration/ tests
├── frontend/
│   ├── src/
│   │   ├── api/           # fetch client + API modules (auth, tools, weather)
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth and Inventory context + reducers
│   │   ├── hooks/         # useAuth, useInventory, useAsyncResource, ...
│   │   ├── pages/         # Home, Catalog, ToolDetail, Login, Register, NotFound
│   │   ├── utils/         # format, validation, weather, safetySheet
│   │   └── __tests__/     # Component, page, reducer and util tests
│   └── vite.config.js
├── package.json           # Root scripts that drive both apps
└── vercel.json            # Deployment config and routing
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (local, or a hosted one such as Neon or Supabase)

### 1. Clone and install

```bash
git clone https://github.com/Frasse007/civicshare.git
cd civicshare
npm run install:all
```

### 2. Configure environment variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/civicshare
DATABASE_SSL=false
JWT_SECRET=replace-with-a-long-random-string-16+chars
JWT_EXPIRES_HOURS=2
CORS_ORIGINS=http://localhost:5173
COOKIE_SAMESITE=lax
DB_SYNC=true
SEED_ON_BOOT=true
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | At least 16 characters |
| `PORT` | No | API port (default `4000`) |
| `JWT_EXPIRES_HOURS` | No | Session lifetime (default `2`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default `http://localhost:5173`) |
| `COOKIE_SAMESITE` | No | `lax`, `strict` or `none` (default `lax`) |
| `DB_SYNC` | No | Create/update tables on boot (default `true`) |
| `SEED_ON_BOOT` | No | Insert demo data into empty tables on boot (default `false`) |

The server validates these on startup and exits with a clear message if any are missing or invalid.

### 3. If running locally create database & seed
```bash
createdb civicshare && createdb civicshare_test 

npm run seed
```

### 4. Run the app

In two terminals:

```bash
npm run dev:backend    # API on http://localhost:4000
npm run dev:frontend   # App on http://localhost:5173
```

Vite proxies `/api` to the backend, so cookies behave the same as in production.

To seed demo data manually: `npm run seed`.

### Demo accounts (development only)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@civicshare.dev` | `Admin123!` |
| Member | `member@civicshare.dev` | `Member123!` |

> These exist for demonstration. Remove or replace them before any real use.

### Useful scripts

| Command | What it does |
|---------|--------------|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run dev:backend` / `dev:frontend` | Start each dev server |
| `npm run seed` | Seed demo users and tools |
| `npm test` | Run backend and frontend tests |
| `npm run lint` | Lint both apps |
| `npm run build` | Production build of the frontend |

## Usage

1. Open the app and **register** an account (or log in with a demo account).
2. Go to the **Catalog**. Type in the search box, then narrow by category, condition, status or minimum safety rating. Your filters are kept when you open a tool and press Back.
3. Open a tool to see its condition, safety rating, pickup station, gear and guidelines. For weather-sensitive tools, check the 7-day forecast before you head out.
4. Click the safety sheet button to download printable safety documentation.
5. **Admins:** use the status control on a tool to mark it `available`, `borrowed` or `maintenance`, and add new tools.

## API Reference

Base path: `/api`. Errors are returned as `{ "error": { "message": "...", ... } }`.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | Health check, verifies the database is reachable |
| POST | `/auth/register` | Public (rate-limited) | Create an account |
| POST | `/auth/login` | Public (rate-limited) | Log in, sets HTTP-only session cookie |
| POST | `/auth/logout` | Public | Clear the session cookie |
| GET | `/auth/me` | Authenticated | Current user |
| GET | `/tools` | Public | List tools. Query: `search`, `category`, `condition`, `status`, `minSafety`, `sort` (`name`\|`safety`\|`newest`), `page`, `pageSize` (max 50) |
| GET | `/tools/:id` | Public | Single tool |
| POST | `/tools` | Admin | Create a tool |
| PATCH | `/tools/:id/status` | Admin | Update a tool's status |

## Architecture & Design Decisions

### Layered backend (data / business logic / presentation)

```
Route → Validation middleware → Controller → Service → Model (Sequelize) → PostgreSQL
```

- **Models** define the data layer (`User`, `Tool`).
- **Services** hold business logic (search building, auth, tool mutations) with no knowledge of HTTP, so they are easy to unit test.
- **Controllers** are thin: parse the request, call a service, send the response.
- **Routes** declare the middleware chain for each endpoint.

### Design patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **Factory** | `createApp()` in `backend/src/app.js` | Builds the Express app without listening or touching the DB, so integration tests can mount the real middleware stack with Supertest. |
| **Reducer / Observer (React Context)** | `AuthContext`, `InventoryContext` with pure reducers | Components subscribe to shared state. Pure reducers are trivially unit tested. |
| **Facade** | `frontend/src/api/client.js` | One place for base URL, cookies and error normalization (`ApiError`). |
| **Custom hooks** | `useAsyncResource`, `useDebouncedValue`, `useInventory` | Reusable async state and debounced search without repeated code. |

### Key technical decisions

- **HTTP-only cookie for the JWT** instead of `localStorage`, so scripts in the page cannot read the token (XSS mitigation).
- **Zod validation at the edge** for bodies, params and query strings; a central config module validates environment variables on boot.
- **Deny-by-default RBAC:** admin routes are composed with `authenticate` and `requireRole(ADMIN)`.
- **Filters live in context, not component state**, so the catalog survives navigation.
- **Open-Meteo for weather**, since it needs no API key.
- **Single Vercel project with two services** (`vercel.json`): `/api/*` routes to the Express backend, everything else to the Vite frontend, making the app same-origin in production.

### Tradeoffs and alternatives considered
 
Each major decision was weighed against at least one realistic alternative. The "cost" column is what this project gives up by its choice.
 
| Decision | Chosen | Alternatives considered | Why this one | Cost |
|----------|--------|------------------------|--------------|------------------------|
| Session storage | JWT in an HTTP-only cookie | JWT in `localStorage`; server-side sessions (e.g. `express-session` + store) | Page scripts can't read the cookie, which limits XSS token theft. Stateless, so it works on Vercel serverless with no session store. | Tokens can't be revoked before expiry (mitigated by a short 2-hour lifetime). Cookies need strict CORS and, with a separate origin, CSRF thought (`SameSite` is configurable). |
| Database | PostgreSQL + Sequelize | MongoDB + Mongoose; SQLite; Prisma | Tool data is relational and filter-heavy (category, status, rating ranges, `ILIKE` search), and Postgres adds `ENUM` and `JSONB` for safety lists. Hosted Postgres (Neon) is free and works with Vercel. | More setup than SQLite. Sequelize is more verbose than Prisma and has weaker type safety. |
| Schema management | `sequelize.sync()` on boot (`DB_SYNC`) | Versioned migrations (`sequelize-cli`, Prisma Migrate) | Fastest way to iterate during an MVP; seeding and test resets stay simple. | `sync()` doesn't track changes, so evolving a production schema safely will need migrations. |
| Backend framework | Express 5 | Fastify; NestJS; Next.js API routes | Small and familiar, with a middleware chain that makes validation, auth and RBAC explicit. Deploys to Vercel as-is. | No built-in structure or DI like NestJS, so the layering is enforced by convention (routes, controllers, services). |
| Validation | Zod schemas in middleware | Joi; hand-written checks; Sequelize validators only | One schema defines and enforces types for bodies, params and queries, with field-level errors the forms can show. | A second source of truth next to the Sequelize models, so rules like category lists must stay in sync (they're imported from the models to limit drift). |
| Frontend | React SPA built with Vite | Next.js (SSR/SSG); plain HTML/JS | Fast dev server and build. The app is mostly behind interactive filters, so SSR adds little for an MVP. | Public catalog pages aren't server-rendered, which is worse for SEO and first load. |
| Client state | React Context + `useReducer` | Redux Toolkit; Zustand; React Query | Only two shared concerns (auth, catalog filters), so no extra dependency. Pure reducers are easy to unit test. | No built-in caching or request de-duplication; `useAsyncResource` covers the basics only. |
| Availability model | A single `status` field set by admins | A `reservations` table with date ranges | Delivers the Sprint 1 core (browse and manage inventory) with the least complexity. | Availability isn't derived from bookings and can't prevent double-booking. Listed under Future Enhancements. |
| Pagination | Offset/limit (`page`, `pageSize`) | Cursor-based | Simple, supports "jump to page" in the UI, and fine at neighborhood-catalog scale. | Can skip or repeat rows if data changes between requests, and slows on very large tables. |
| Weather data | Open-Meteo called from the browser | Backend proxy; OpenWeatherMap (API key) | No API key to protect, and no extra backend load or latency. | The browser depends directly on a third party, and we can't cache or rate-limit it centrally. |
| Safety sheet | Plain-text file generated client-side | PDF generation; server-rendered documents | No dependencies, instant, and prints anywhere. | Plain formatting only. |
| Hosting | One Vercel project, two services, `/api` rewrite | Vercel (frontend) + Render (backend); separate domains | Same origin in production, so no cross-site cookies or CORS problems, and one deploy on every push to `main`. | Backend runs as serverless functions: cold starts, and a small DB connection pool (max 5) to avoid exhausting connections. |
| Backend structure | Layered (route, controller, service, model) | Fat controllers; domain-driven modules | Keeps business logic free of HTTP so it can be unit tested without a server. | More files and indirection than the current feature set strictly needs. |

## Testing

**Framework:** [Vitest](https://vitest.dev/) in both packages, Supertest for backend HTTP tests, and React Testing Library with jsdom for the frontend.

```bash
npm test                              # everything
npm --prefix backend test             # backend only
npm --prefix frontend test            # frontend only
npm --prefix backend run test:coverage
npm --prefix frontend run test:coverage
```

> Backend tests need a PostgreSQL database. They use `TEST_DATABASE_URL`, falling back to `postgres://civic:civic@localhost:5432/civicshare_test`. The test database is wiped and reseeded, so never point it at real data.

**What is covered**

| Area | Tests |
|------|-------|
| Backend unit | env parsing, middleware, input sanitizing, token helpers, tool service (search/filters), validators |
| Backend integration | auth flow, health check, tool catalog and admin endpoints (via Supertest) |
| Frontend | API client, reducers, contexts, components, pages, user interactions, weather and utility helpers |

Tests cover both success paths and common failures, such as invalid input, wrong credentials, unauthenticated access, non-admin access to admin routes, unknown tool IDs and failed weather requests.

**Backend**
---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------|---------|----------|---------|---------|-------------------
All files            |   88.93 |    79.61 |   98.27 |   88.55 |                   
 src                 |   94.73 |    88.88 |     100 |     100 |                   
  app.js             |   94.73 |    88.88 |     100 |     100 | 35                
 src/config          |   94.44 |       60 |     100 |   93.33 |                   
  database.js        |      80 |       50 |     100 |      80 | 12                
  env.js             |     100 |      100 |     100 |     100 |                   
 src/controllers     |     100 |      100 |     100 |     100 |                   
  auth.controller.js |     100 |      100 |     100 |     100 |                   
  tool.controller.js |     100 |      100 |     100 |     100 |                   
 src/db              |       0 |        0 |       0 |       0 |                   
  init-db.js         |       0 |        0 |       0 |       0 | 2-40              
 src/middleware      |   97.72 |    94.28 |     100 |   97.14 |                   
  auth.js            |     100 |      100 |     100 |     100 |                   
  errorHandler.js    |   88.88 |    83.33 |     100 |   88.88 | 17                
  sanitize.js        |     100 |      100 |     100 |     100 |                   
  validate.js        |     100 |       80 |     100 |     100 | 10                
 src/models          |     100 |      100 |     100 |     100 |                   
  Tool.js            |     100 |      100 |     100 |     100 |                   
  User.js            |     100 |      100 |     100 |     100 |                   
  index.js           |       0 |        0 |       0 |       0 |                   
 src/routes          |   94.73 |      100 |     100 |   94.73 |                   
  auth.routes.js     |     100 |      100 |     100 |     100 |                   
  health.routes.js   |   83.33 |      100 |     100 |   83.33 | 12                
  tool.routes.js     |     100 |      100 |     100 |     100 |                   
 src/seeds           |     100 |       50 |     100 |     100 |                   
  seed.js            |     100 |       50 |     100 |     100 | 14-21             
  tools.js           |     100 |      100 |     100 |     100 |                   
 src/services        |   95.65 |     91.3 |     100 |   97.29 |                   
  auth.service.js    |   88.88 |       80 |     100 |   93.33 | 22                
  tool.service.js    |     100 |      100 |     100 |     100 |                   
 src/utils           |     100 |      100 |     100 |     100 |                   
  AppError.js        |     100 |      100 |     100 |     100 |                   
  tokens.js          |     100 |      100 |     100 |     100 |                   
 src/validators      |     100 |      100 |     100 |     100 |                   
  auth.validators.js |     100 |      100 |     100 |     100 |                   
  tool.validators.js |     100 |      100 |     100 |     100 |                   
---------------------|---------|----------|---------|---------|-------------------

**Frontend**
-------------------------|---------|----------|---------|---------|-------------------
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------------|---------|----------|---------|---------|-------------------
All files                |   97.42 |    95.78 |   96.47 |   97.45 |                   
 src                     |     100 |      100 |     100 |     100 |                   
  App.jsx                |     100 |      100 |     100 |     100 |                   
 src/api                 |      98 |    96.55 |      95 |     100 |                   
  authApi.js             |     100 |      100 |     100 |     100 |                   
  client.js              |     100 |       95 |     100 |     100 | 17                
  toolsApi.js            |   92.85 |      100 |   85.71 |     100 |                   
  weatherApi.js          |     100 |      100 |     100 |     100 |                   
 src/components          |   93.24 |    98.41 |   90.47 |   92.53 |                   
  AdminStatusControl.jsx |    92.3 |      100 |   83.33 |    92.3 | 34                
  FilterBar.jsx          |   95.23 |    88.88 |    90.9 |   94.44 | 38                
  Footer.jsx             |     100 |      100 |     100 |     100 |                   
  FormField.jsx          |     100 |      100 |     100 |     100 |                   
  Header.jsx             |      60 |      100 |      50 |      60 | 11-12             
  Layout.jsx             |     100 |      100 |     100 |     100 |                   
  NavBar.jsx             |     100 |      100 |     100 |     100 |                   
  Pagination.jsx         |      80 |      100 |   66.66 |      75 | 5                 
  Reveal.jsx             |     100 |      100 |     100 |     100 |                   
  SafetyRating.jsx       |     100 |      100 |     100 |     100 |                   
  StateMessage.jsx       |     100 |      100 |     100 |     100 |                   
  StatusBadge.jsx        |     100 |      100 |     100 |     100 |                   
  ToolCard.jsx           |     100 |      100 |     100 |     100 |                   
  WeatherForecast.jsx    |     100 |      100 |     100 |     100 |                   
 src/context             |   98.57 |       85 |     100 |   98.33 |                   
  AuthContext.jsx        |     100 |       50 |     100 |     100 | 21                
  InventoryContext.jsx   |     100 |       50 |     100 |     100 | 24                
  authReducer.js         |     100 |      100 |     100 |     100 |                   
  inventoryReducer.js    |    92.3 |     90.9 |     100 |   91.66 | 46                
 src/hooks               |   94.44 |    81.81 |     100 |   95.34 |                   
  useAsyncResource.js    |     100 |       90 |     100 |     100 | 22                
  useAuth.js             |     100 |      100 |     100 |     100 |                   
  useDebouncedValue.js   |     100 |      100 |     100 |     100 |                   
  useInventory.js        |      75 |       50 |     100 |     100 | 6                 
  useReveal.js           |    87.5 |    71.42 |     100 |   86.66 | 15-16             
 src/pages               |     100 |     98.3 |     100 |     100 |                   
  CatalogPage.jsx        |     100 |      100 |     100 |     100 |                   
  HomePage.jsx           |     100 |      100 |     100 |     100 |                   
  LoginPage.jsx          |     100 |      100 |     100 |     100 |                   
  NotFoundPage.jsx       |     100 |      100 |     100 |     100 |                   
  RegisterPage.jsx       |     100 |      100 |     100 |     100 |                   
  ToolDetailPage.jsx     |     100 |    93.75 |     100 |     100 | 82                
 src/utils               |     100 |      100 |     100 |     100 |                   
  format.js              |     100 |      100 |     100 |     100 |                   
  safetySheet.js         |     100 |      100 |     100 |     100 |                   
  validation.js          |     100 |      100 |     100 |     100 |                   
  weather.js             |     100 |      100 |     100 |     100 |                   
-------------------------|---------|----------|---------|---------|-------------------

## Deployment

The app is deployed on **Vercel**: https://civicshare.vercel.app/

- `vercel.json` defines two services (`backend` as Express, `frontend` as Vite) and rewrites `/api/*` to the backend and all other paths to the frontend.
- `backend/src/app.js` exports a default app instance for Vercel's serverless runtime.
- Pushes to the `main` branch trigger automatic production deployments.
- Set the backend environment variables from the table above in the Vercel project settings. Use a hosted PostgreSQL database for `DATABASE_URL`, set `NODE_ENV=production`, and set `CORS_ORIGINS` to the deployed URL.
- Health check: `GET https://civicshare.vercel.app/api/health`

## Screenshots

| Catalog | Tool detail + weather |
|---|---|
| ![Catalog](docs/screenshots/catalog-desktop.png) | ![Tool detail](docs/screenshots/tool-detail-desktop.png) |

| Mobile home | Mobile catalog | Mobile menu |
|---|---|---|
| <img src="docs/screenshots/home-mobile.png" width="220"> | <img src="docs/screenshots/catalog-mobile.png" width="220"> | <img src="docs/screenshots/mobile-menu.png" width="220"> |

## Troubleshooting

| Problem | Likely cause and fix |
|---------|---------------------|
| `Invalid environment configuration` on startup | A required variable is missing or invalid. Check `DATABASE_URL` is set and `JWT_SECRET` is 16+ characters. |
| `CRITICAL DATABASE ERROR: Connection string is missing` | `backend/.env` is missing or not in `backend/`. |
| Cannot connect to the database | Confirm PostgreSQL is running and the credentials are right. The Sequelize config requires SSL, so a local database without SSL may need that option adjusted in `backend/src/config/database.js`. |
| Catalog is empty | Run `npm run seed` or set `SEED_ON_BOOT=true`. Seeding only fills empty tables. |
| Login works but you are logged out on refresh, or CORS errors | Make sure `CORS_ORIGINS` exactly matches the frontend origin (no trailing slash) and use the Vite dev server (it proxies `/api`) so cookies stay same-origin. |
| "Too many attempts" on login | Auth endpoints are rate limited (20 requests per 15 minutes per IP by default). Wait and retry. |
| Backend tests fail to connect | Start PostgreSQL and create the `civicshare_test` database, or set `TEST_DATABASE_URL`. |
| Weather forecast does not load | The Open-Meteo request failed (offline or blocked). Use the retry option in the UI. |
| Port already in use | Change `PORT` in `backend/.env` (and the proxy target in `frontend/vite.config.js`), or stop the other process. |

## Known Limitations

- **No reservations yet.** A tool's `status` doubles as its availability flag and is set manually by an admin; availability is not derived from bookings.
- **No borrow/return workflow, due dates, or notifications.**
- **Admin-only tool creation.** Members cannot list their own equipment yet.
- **Demo seed accounts** with known passwords are included for showcase purposes.
- **Fixed catalog categories** (Cleaning, Lawn & Garden, Ladders, Woodworking, Power Tools, Painting).
- No password reset or email verification.
- Weather depends on a third-party service and shows no data offline.

## Future Enhancements

- Reservation and borrowing system with live availability, due dates and reminders
- Member-submitted tools with admin approval
- Map view of pickup stations
- Photos for tools
- Ratings, reviews and borrower reputation
- Password reset and email verification
- Admin dashboard with usage reports
- Continuous integration running lint and tests on every pull request

## Author

Built by [Frasse007](https://github.com/Frasse007).
