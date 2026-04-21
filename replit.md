# Photogram

## Overview

Photogram is a full-stack social media web app for photographers. Dark, cinematic aesthetic. Built with React + Vite frontend and Node.js/Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS (artifacts/photogram)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Prisma 7 (with `@prisma/adapter-pg` driver adapter — Prisma 7 requires it)
- **Cache**: Optional Redis via `REDIS_URL` (silently falls back to DB if not set)
- **Auth**: JWT (access + refresh tokens) via bcryptjs + jsonwebtoken
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **State**: TanStack React Query (generated hooks)

## Features

- Authentication (signup/login/logout/refresh)
- User profiles with follow/unfollow
- Posts with images, titles, captions, camera references
- Likes (unique per user/post)
- Comments
- Camera system (admin-controlled list of camera models)
- Personalized feed (posts from followed users)
- Discover/Explore page (trending by likes) with text search
- Search bar with autocomplete: location-aware suggestions (haversine ranking) + popular fallback, Redis-cached
- Platform stats summary

## Architecture Notes

- **Server layout** (`artifacts/api-server/src/`): `models/` (Prisma queries) → `services/` (business logic) → `controllers/` (req/res) → `routes/` (Express).
- **Client layout** (`artifacts/photogram/src/features/`): one folder per feature (`auth`, `posts`, `discover`, `profile`, `search`).
- **DB**: Prisma schema in `lib/db/prisma/schema.prisma`. Datasource URL is loaded in `lib/db/prisma.config.ts` (Prisma 7 requires it there, not in the schema). Generator must set `engineType = "library"` for completeness, but Prisma 7 still expects a driver adapter; we instantiate `PrismaClient` with `new PrismaPg({ connectionString })`.
- **Suggestions table** uses uuid PK (new table); all other tables preserve the original serial/autoincrement int IDs.
- **API codegen quirk**: after running `pnpm --filter @workspace/api-spec run codegen`, rewrite `lib/api-zod/src/index.ts` to only `export * from "./generated/api";` (orval `clean: true` regenerates an export of `./generated/api.schemas` which doesn't exist for the zod target).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/photogram run dev` — run frontend locally

## Important: After Codegen

After running codegen, always fix `lib/api-zod/src/index.ts` to only export from `./generated/api` (codegen regenerates the file with extra duplicate exports):

```ts
export * from "./generated/api";
```

## API Routes

- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `POST /api/auth/refresh` — Refresh tokens
- `GET /api/users/:id` — Get user profile
- `PATCH /api/users/:id` — Update profile
- `POST /api/users/:id/follow` — Follow user
- `DELETE /api/users/:id/follow` — Unfollow user
- `GET /api/users/:id/posts` — Get user's posts
- `GET /api/posts` — Global feed
- `POST /api/posts` — Create post
- `GET /api/posts/:id` — Get post
- `PATCH /api/posts/:id` — Update post
- `DELETE /api/posts/:id` — Delete post
- `POST /api/posts/:id/like` — Like post
- `DELETE /api/posts/:id/like` — Unlike post
- `GET /api/posts/:id/comments` — List comments
- `POST /api/posts/:id/comments` — Create comment
- `DELETE /api/comments/:id` — Delete comment
- `GET /api/cameras` — List cameras
- `POST /api/cameras` — Create camera (admin)
- `GET /api/feed` — Personalized feed
- `GET /api/discover` — Discover/trending
- `GET /api/stats/summary` — Platform stats
- `POST /api/upload/image` — Upload image (mock/passthrough)

## Demo Accounts

- alex@photogram.app / demo1234
- maya@photogram.app / demo1234

## Database Schema

- `users` — id, name, email, password_hash, avatar_url, bio, is_admin, created_at, updated_at
- `cameras` — id, name, icon_url
- `posts` — id, title, caption, image_url, user_id, camera_id, created_at, updated_at
- `likes` — user_id, post_id, created_at (unique constraint)
- `comments` — id, content, user_id, post_id, created_at
- `follows` — follower_id, following_id, created_at (unique constraint)
