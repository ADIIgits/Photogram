# Photogram

## Overview

Photogram is a full-stack social media web app tailored for photographers, featuring a dark, cinematic aesthetic. It is built with a React + Vite frontend and a Node.js/Express backend.

---

## Technical Stack

* **Node.js**: v20 / v24
* **Package Manager**: npm (Standard individual packages)
* **Frontend**: React + Vite + Tailwind CSS v4
* **Backend API**: Express 5
* **Database & ORM**: PostgreSQL + Prisma 7 (using the `@prisma/adapter-pg` driver adapter)
* **Caching Layer**: Optional Redis (gracefully falls back to Postgres if unconfigured)
* **Authentication**: JWT (short-lived access token + long-lived refresh token in cookies) via `bcryptjs` and `jsonwebtoken`
* **Validation**: Zod
* **API Codegen**: Orval (generates React Query hooks directly from OpenAPI spec)

---

## Project Structure

The project is structured as two independent, self-contained `npm` packages:

```
photogram/
├── backend/                  # Express 5 API Server & Prisma Database layer
│   ├── api-spec/             # OpenAPI spec definitions and Orval config
│   │   ├── openapi.yaml      # The OpenAPI 3.0 specification
│   │   └── orval.config.ts   # Configuration for Orval client generator
│   ├── prisma/
│   │   └── schema.prisma     # Prisma database schema definition
│   ├── src/                  # Backend application source code
│   │   ├── config/           # App configuration and environment validation
│   │   ├── controllers/      # Request/Response handlers
│   │   ├── db/               # Prisma Client initialization & adapter
│   │   ├── lib/              # Utility helpers (auth, email, redis, otp, logger)
│   │   ├── routes/           # Express API endpoints
│   │   └── index.ts          # Server entry point
│   ├── .env                  # Backend environment variables
│   └── package.json
│
├── frontend/                 # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── api-client/       # Generated React Query hooks and custom fetch client
│   │   ├── components/       # Common reusable UI components (shadcn/ui-based)
│   │   ├── features/         # Feature-based pages (auth, posts, discover, profile, search)
│   │   └── main.tsx          # Frontend entry point
│   ├── .env                  # Frontend environment variables
│   └── package.json
```

---

## Environment Variables Configuration

Both the frontend and backend require a `.env` file to be created in their respective folders before starting.

### 1. Backend Environment (`backend/.env` & Root `/.env`)
Create a `.env` file in the `backend/` directory (or use the one in the root workspace) with the following content:

```ini
# Server Port & Mode
PORT=8080
NODE_ENV=development

# JWT Security
SESSION_SECRET=photogram-dev-secret-change-me-in-production

# PostgreSQL Database Connection
DATABASE_URL="postgresql://neondb_owner:YOUR_PASS@YOUR_HOST:5432/neondb?sslmode=require"

# (Optional) Caching
# REDIS_URL=redis://localhost:6379

# (Optional for Dev, Required for Prod) Gmail SMTP Transporter for OTP Emails
# In development, leave blank to print OTPs directly to your console!
SMTP_USER=""
SMTP_PASS=""
```

### 2. Frontend Environment (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:

```ini
# In development, leave commented out to use the local Vite proxy
# VITE_API_URL=http://localhost:8080

# API server URL for production builds
VITE_API_URL=https://your-production-backend-url.com
```

---

## Getting Started

Follow these steps to set up and run the application locally.

### Step 1: Database Setup
1. Open your terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Push the Prisma database schema to your PostgreSQL database:
   ```bash
   npx prisma db push
   ```

### Step 2: Running the Backend
1. In the `backend/` directory, start the API development server:
   ```bash
   npm run dev
   ```
   *The server will start listening on port `8080` (or the port defined in your `.env` file).*

### Step 3: Running the Frontend
1. Open a new terminal tab/window and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will start, typically on port `5173`. It is configured to automatically proxy `/api` requests to your backend on `http://localhost:8080`.*

---

## API Client & Codegen Integration

The project uses **Orval** to generate TanStack React Query hooks directly from the OpenAPI specification:
* The API contract is defined in `backend/api-spec/openapi.yaml`.
* The generated client (including all queries, mutations, and TypeScript models) is written directly to `frontend/src/api-client/generated/`.

To regenerate the API client after making changes to `openapi.yaml`:
1. Navigate to the API spec folder:
   ```bash
   cd backend/api-spec
   ```
2. Install spec dependencies:
   ```bash
   npm install
   ```
3. Run the codegen script:
   ```bash
   npm run codegen
   ```

---

## Features Showcase

* **OTP Authentication**: Register with email verification codes. If SMTP is not set up during development, look at the backend terminal to get your code.
* **Cinematic Dark Design**: Crafted meticulously with custom dark mode colors and custom gradients using Tailwind CSS v4.
* **Smart Location Search**: Autocomplete bar for search queries leveraging a location-aware haversine ranking algorithm, cached gracefully using Redis if available.
* **Personalized Feed & Explore**: View posts specifically from creators you follow, or discover trending posts ranked dynamically by likes on the Discover page.
