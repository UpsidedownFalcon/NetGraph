# NetGraph — Technical Requirements Document (TRD)

## 1. Architecture overview

NetGraph is a **single Next.js (App Router) application** that serves both the UI
and the backend API from one codebase. There is no separate server.

```
Browser (React client components)
   │  fetch() to /api/*
   ▼
Next.js Route Handlers  (src/app/api/**/route.js)
   │  call data-access functions
   ▼
src/lib/db.js  ──►  SQLite file (data/data.db) via better-sqlite3
```

- **Rendering:** Pages are server components; the interactive UI (`AppClient` and
  friends) are client components (`"use client"`).
- **Auth gate:** Server components check the session before rendering protected
  pages; API routes enforce it on every request via a `withAuth` wrapper.
- **State:** The client holds people + relationships in React state, lifted into
  `AppClient`, and re-fetches after mutations ("data down, events up").

## 2. Technology choices & rationale

| Area        | Choice                  | Why                                                       |
| ----------- | ----------------------- | -------------------------------------------------------- |
| Framework   | Next.js App Router      | One app for UI + API; file-based routing; server comps.  |
| DB driver   | `better-sqlite3`        | Synchronous, fast, zero-config, single-file local DB.    |
| Graph       | `@xyflow/react`         | Mature node/edge canvas with custom nodes/edges.         |
| Auth        | `iron-session`          | Stateless encrypted cookie; no session store needed.     |
| Hashing     | `bcryptjs`              | Pure-JS bcrypt; no native build step.                    |
| Markdown    | `react-markdown`        | Safe, component-based markdown rendering.                |

`better-sqlite3` is declared in `serverExternalPackages` (next.config.mjs) so Next
does not try to bundle the native module.

## 3. Data model

SQLite, with foreign keys enabled (`PRAGMA foreign_keys = ON`) and WAL journaling.
Schema is created idempotently (`CREATE TABLE IF NOT EXISTS`) on first DB open.

### 3.1 `people`
| Column        | Type    | Notes                                                        |
| ------------- | ------- | ------------------------------------------------------------ |
| `id`          | INTEGER | Primary key, autoincrement                                   |
| `name`        | TEXT    | Required                                                     |
| `ask`         | TEXT    | Default `''`                                                 |
| `status`      | TEXT    | One of `known`, `to_contact`, `avoid`, `friend` (CHECK)      |
| `background`  | TEXT    | Default `''` (markdown)                                      |
| `how_we_met`  | TEXT    | Default `''` (markdown)                                      |
| `position_x`  | REAL    | Canvas X                                                     |
| `position_y`  | REAL    | Canvas Y                                                     |
| `created_at`  | TEXT    | `datetime('now')`                                            |
| `updated_at`  | TEXT    | `datetime('now')`, bumped on update                         |

### 3.2 `channels` (many per person)
| Column       | Type    | Notes                                                         |
| ------------ | ------- | ------------------------------------------------------------- |
| `id`         | INTEGER | Primary key                                                   |
| `person_id`  | INTEGER | FK → `people(id)` `ON DELETE CASCADE`                         |
| `channel`    | TEXT    | One of whatsapp, sms, x, instagram, email, linkedin, discord, other (CHECK) |
| `handle`     | TEXT    | Default `''`                                                  |
| `is_primary` | INTEGER | `0`/`1`                                                       |

Index: `idx_channels_person (person_id)`.

### 3.3 `relationships` (directional edges)
| Column       | Type    | Notes                                                         |
| ------------ | ------- | ------------------------------------------------------------- |
| `id`         | INTEGER | Primary key                                                   |
| `source_id`  | INTEGER | FK → `people(id)` `ON DELETE CASCADE`                         |
| `target_id`  | INTEGER | FK → `people(id)` `ON DELETE CASCADE`                         |
| `label`      | TEXT    | Default `''`                                                  |
| `created_at` | TEXT    | `datetime('now')`                                            |

Constraints: `CHECK (source_id <> target_id)`, `UNIQUE (source_id, target_id)`.
Indexes: `idx_rel_source`, `idx_rel_target`.

### 3.4 Access patterns
- `listPeople()` runs two queries (all people, all channels) and groups channels
  in JS to avoid N+1 queries; returns each person with a `channels` array.
- `getPerson(id)` attaches that person's channels.
- Updates use a whitelist of allowed fields and build a parameterised `SET` clause.
- All queries use **prepared statements with bound parameters** (no string
  interpolation of user input) to prevent SQL injection.

## 4. API reference

All routes are JSON. All **data** routes require authentication (return `401`
otherwise). Auth routes are public.

### Auth
| Method | Path           | Body                      | Returns                          |
| ------ | -------------- | ------------------------- | -------------------------------- |
| POST   | `/api/login`   | `{ username, password }`  | `{ authenticated: true }` or 401 |
| POST   | `/api/logout`  | —                         | `{ authenticated: false }`       |
| GET    | `/api/session` | —                         | `{ authenticated: boolean }`     |

### People
| Method | Path                 | Body / Notes                              | Returns            |
| ------ | -------------------- | ----------------------------------------- | ------------------ |
| GET    | `/api/people`        | —                                         | `Person[]`         |
| POST   | `/api/people`        | `{ name, status?, ask?, … }` (name req.)  | `Person` (201)     |
| GET    | `/api/people/:id`    | —                                         | `Person` or 404    |
| PATCH  | `/api/people/:id`    | any subset of fields                      | updated `Person`   |
| DELETE | `/api/people/:id`    | —                                         | `{ ok: true }`     |

### Channels
| Method | Path                         | Body                              | Returns           |
| ------ | ---------------------------- | --------------------------------- | ----------------- |
| POST   | `/api/people/:id/channels`   | `{ channel, handle?, is_primary? }` | `Channel` (201) |
| PATCH  | `/api/channels/:id`          | subset of `channel/handle/is_primary` | `Channel`     |
| DELETE | `/api/channels/:id`          | —                                 | `{ ok: true }`    |

### Relationships
| Method | Path                       | Body / Notes                                   | Returns               |
| ------ | -------------------------- | ---------------------------------------------- | --------------------- |
| GET    | `/api/relationships`       | —                                              | `Relationship[]`      |
| POST   | `/api/relationships`       | `{ source_id, target_id, label? }`             | `Relationship` (201)  |
| PATCH  | `/api/relationships/:id`   | `{ label }`                                    | `Relationship`        |
| DELETE | `/api/relationships/:id`   | —                                              | `{ ok: true }`        |

**Validation highlights:** name required; status must be in the allowed set;
channel type must be allowed; relationships reject self-links (`400`) and
duplicates (`409`), and require both people to exist (`400`).

## 5. Authentication & sessions

- Credentials come from env: `APP_USERNAME` and `APP_PASSWORD_HASH_B64` (a
  base64-encoded bcrypt hash — base64 protects the `$` characters from `.env`/shell
  mangling). A raw `APP_PASSWORD_HASH` is also accepted as a fallback.
- `POST /api/login` verifies the username and `bcrypt.compareSync` of the password
  against the stored hash, then marks the `iron-session` as authenticated.
- `src/lib/session.js` defines the cookie (`netgraph_session`, httpOnly, lax,
  `secure` in production) keyed by `SESSION_SECRET`, plus:
  - `getSession()`, `isAuthed()`
  - `withAuth(handler)` — wraps a route handler to 401 unless authenticated.
- Pages enforce auth server-side: `/` redirects to `/app` or `/login`; `/app`
  redirects to `/login` when not authed; `/login` redirects to `/app` when authed.
- The client also bounces to `/login` if a data fetch returns 401 (expired session).

## 6. Frontend composition

| Component        | Responsibility                                                       |
| ---------------- | -------------------------------------------------------------------- |
| `AppClient`      | State hub: loads data, owns selection/popup/tab, passes handlers.    |
| `GraphView`      | React Flow canvas: nodes/edges, search, focus/dim, connect, drag.    |
| `PersonNode`     | Custom node: glowing dot, labels (ask rendered as markdown), pulse, drag grip, connection handle. |
| `FloatingEdge`   | Custom edge: straight arrow attaching to dot edges; delete button.   |
| `edgeGeometry.js`| Computes where an edge meets each node's boundary.                   |
| `DetailPopup`    | Create/edit a person; status, markdown notes, channels.             |
| `TableView`      | Spreadsheet view with edit-on-blur cells.                           |
| `MarkdownField`  | Write/Preview notes editor.                                          |
| `Constellation`  | Decorative animated starfield on a `<canvas>`.                      |

## 7. Configuration

| Variable                | Required | Purpose                                            |
| ----------------------- | -------- | -------------------------------------------------- |
| `APP_USERNAME`          | yes      | Login username                                     |
| `APP_PASSWORD_HASH_B64` | yes      | Base64 bcrypt hash of the password                 |
| `SESSION_SECRET`        | yes      | Key encrypting the session cookie (32+ chars)      |
| `DATA_DIR`              | no       | Override DB directory (default `./data`)           |

`.env.local` holds real values and is gitignored; `.env.example` is the template.

## 8. Build & runtime notes

- `serverExternalPackages: ["better-sqlite3"]` in `next.config.mjs`.
- The DB connection is a **lazy singleton** (`getDb()`), opened on first use.
- New API route files may require a dev-server restart to register.
- Environment variables are read at server startup — changing `.env.local`
  requires restarting `npm run dev`.

## 9. Security considerations

- Parameterised SQL everywhere; field whitelists on updates.
- Hashed passwords only; encrypted, http-only cookie.
- Single-user, local-first; for any non-localhost deployment, require HTTPS and a
  strong unique `SESSION_SECRET`.
