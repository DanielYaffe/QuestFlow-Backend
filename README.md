# QuestFlow Backend

Express + TypeScript REST API for QuestFlow. Handles authentication, questline management, AI content generation (Gemini), sprite generation with async SSE delivery, and S3/MinIO image storage.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT (access + refresh tokens), Google OAuth (Passport.js) |
| AI | Google Gemini (`@google/genai`) |
| Image Storage | AWS S3 or MinIO (presigned URLs) |
| API Docs | Swagger UI (`swagger-jsdoc` + `swagger-ui-express`) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- S3 bucket **or** MinIO instance
- Google Gemini API key
- (Optional) Google OAuth credentials

### Install & Run

```bash
npm install
cp .env.example .env
# fill in .env values
npm run dev
```

The server starts at `http://localhost:3000`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/questflow

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# AWS S3 (use these for real S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=questflow-sprites

# MinIO (leave blank to use real S3 instead)
MINIO_ENDPOINT=http://localhost:9000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

> **S3 vs MinIO:** If `MINIO_ENDPOINT` is set, the S3 client uses it as a custom endpoint (for local MinIO). Leave it blank to use real AWS S3.

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api-docs
```

All protected endpoints require a `Bearer` JWT token in the `Authorization` header.

---

## API Reference

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register with email + password |
| POST | `/auth/login` | — | Login, returns `accessToken` + `refreshToken` |
| POST | `/auth/refresh` | — | Exchange refresh token for new access token |
| POST | `/auth/logout` | JWT | Invalidate refresh token |
| GET | `/auth/google` | — | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | — | Google OAuth callback |

---

### Questlines — `/questlines`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/questlines` | List user's questlines |
| POST | `/questlines` | Create questline |
| GET | `/questlines/:id` | Get questline by id |
| PUT | `/questlines/:id` | Update questline |
| DELETE | `/questlines/:id` | Delete questline |
| GET | `/questlines/:id/graph` | Get quest graph (nodes + edges) |
| PUT | `/questlines/:id/graph` | Save quest graph |
| GET | `/questlines/:id/variants` | Get quest variants |
| POST | `/questlines/:id/variants` | Add custom variant |
| DELETE | `/questlines/:id/variants/:variantId` | Delete custom variant |
| GET | `/questlines/:id/characters` | List characters |
| POST | `/questlines/:id/characters` | Add character |
| PUT | `/questlines/:id/characters/:characterId` | Update character |
| DELETE | `/questlines/:id/characters/:characterId` | Delete character |
| GET | `/questlines/:id/rewards` | List rewards |
| POST | `/questlines/:id/rewards` | Add reward |
| PUT | `/questlines/:id/rewards/:rewardId` | Update reward |
| DELETE | `/questlines/:id/rewards/:rewardId` | Delete reward |
| GET | `/questlines/:id/chapters` | List chapters |
| POST | `/questlines/:id/chapters` | Add chapter |
| PUT | `/questlines/:id/chapters/:chapterId` | Update chapter |
| DELETE | `/questlines/:id/chapters/:chapterId` | Delete chapter |
| GET | `/questlines/:id/quests` | Get quest node summaries |

---

### AI Quest Generation — `/quests`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/quests/generate` | Generate objectives + rewards from story premise |
| POST | `/quests/generate-characters` | Generate NPC characters from story premise |
| POST | `/quests/generate-questline` | Generate full questline graph from story premise |

---

### Sprites — `/sprites`

Sprite generation is **async** — the generation job runs in the background and results are delivered via Server-Sent Events.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sprites` | List user's sprites (with fresh presigned URLs) |
| POST | `/sprites/generate` | Start async generation job → returns `{ jobId }` |
| GET | `/sprites/jobs/:jobId/stream` | SSE stream — fires when job completes or fails |

**SSE authentication:** `EventSource` cannot send `Authorization` headers. Pass the JWT as `?token=<accessToken>` query parameter instead.

**Flow:**
```
POST /sprites/generate → { jobId }
GET  /sprites/jobs/:jobId/stream?token=<jwt>
  → data: { "status": "done", "result": { imageUrl, imageKey, ... } }
  → data: { "status": "failed", "error": "..." }
```

---

### Quest Styles — `/quest-styles`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/quest-styles` | Get all available quest style presets |

---

### Export Templates — `/export-templates`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/export-templates` | List all export templates |
| POST | `/export-templates` | Create export template |
| DELETE | `/export-templates/:id` | Delete export template |

---

## Project Structure

```
src/
  config/
    config.ts          # Env var config
    passport.ts        # Google OAuth strategy
  controllers/
    authController.ts
    googleAuthController.ts
    questlineController.ts
    questGenerationController.ts
    questStyleController.ts
    spriteController.ts
    exportTemplateController.ts
  middlewares/
    authMiddleware.ts  # JWT auth (also accepts ?token= for SSE)
  models/
    userModel.ts
    questlineModel.ts  # Embedded: nodes, edges, characters, rewards, chapters
    spriteModel.ts
    questStyleModel.ts
    exportTemplateModel.ts
  routes/
    authRoute.ts
    questlineRoute.ts
    questGenerationRoute.ts
    questStyleRoute.ts
    spriteRoute.ts
    exportTemplateRoute.ts
  utils/
    jobQueue.ts        # In-process job queue (EventEmitter per job)
    s3Helper.ts        # S3/MinIO upload + presigned URL helpers
  swagger.ts           # Swagger spec + UI setup
  server.ts            # Express app entry point
```

---

## Background Job Architecture

Sprite generation uses an **in-process job queue** (no Redis/BullMQ required):

1. `POST /sprites/generate` creates a job entry (UUID → EventEmitter) and responds with `{ jobId }` in <50ms
2. Gemini API call runs in the background via `Promise.resolve().then()` — fully detached from the HTTP request lifecycle
3. On completion: uploads to S3, saves to MongoDB, emits `done` event
4. `GET /sprites/jobs/:jobId/stream` opens an SSE connection that listens on the job's EventEmitter
5. Jobs auto-expire from memory after 10 minutes

> **Why no `httpOptions.timeout`?** Setting a timeout on the `GoogleGenAI` constructor causes the SDK to create an internal `AbortController` that gets spuriously triggered by undici's connection lifecycle when the Express response closes. The retry loop (3 attempts, 4s delay) provides resilience instead.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm test` | Run Jest test suite |

---

## Manual Testing

Use the `request.rest` file with the [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension. Set the `@accessToken` variable at the top after logging in.
