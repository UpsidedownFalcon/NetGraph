# NetGraph

A private, login-gated, single-user web app for mapping the people you meet — as
a living constellation of glowing nodes you can connect, annotate, and search.

Built with Next.js (App Router) and React, backed by a local SQLite database.
Everything runs on your own machine; your data never leaves it.

---

## What it does

- **Map people as nodes.** Each person is a glowing dot, coloured by relationship
  status (Known, To contact, Avoid, Friend), with their name and your "ask" shown
  around it.
- **Connect them.** Drag from one person to another to record who introduced or
  knows whom; connections render as directional arrows that re-aim themselves as
  you move nodes.
- **Annotate richly.** Each person has a detail popup with status, "my ask",
  background, how-we-met (all markdown-enabled), and a list of contact channels
  (WhatsApp, email, LinkedIn, …) with a primary marker.
- **Two views, one source of truth.** Flip between the interactive **Graph** and a
  spreadsheet-style **Table** with inline editing — edits in one show up in the other.
- **Find and focus.** Search by anyone's name, notes, or channel handle to fly the
  canvas to them; selecting a person dims everyone except their direct connections.
- **Polished feel.** A drifting starfield background, a gentle pulse on each node,
  and full support for the OS "reduce motion" setting.
- **Locked down.** A single account gated by a hashed password and an encrypted
  session cookie. Every data API returns 401 unless you're signed in.

---

## Tech stack

| Concern         | Choice                                             |
| --------------- | -------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org) (App Router)      |
| UI library      | [React 19](https://react.dev)                      |
| Language        | JavaScript                                         |
| Database        | [SQLite](https://www.sqlite.org) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) |
| Graph canvas    | [`@xyflow/react`](https://reactflow.dev) (React Flow) |
| Auth            | [`iron-session`](https://github.com/vvo/iron-session) + [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) |
| Markdown        | [`react-markdown`](https://github.com/remarkjs/react-markdown) |

---

## Getting started

### Prerequisites
- **Node.js 18.18+** (Node 20+ recommended)
- **npm** (ships with Node)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your secrets
Copy the example env file and fill it in:
```bash
cp .env.example .env.local
```
Then:

1. **Set a password.** Generate a hash of the password you want to log in with:
   ```bash
   npm run hash-password "your-password-here"
   ```
   Copy the printed `APP_PASSWORD_HASH_B64=...` line into `.env.local`.
2. **Set a session secret.** Generate one and paste it as `SESSION_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Pick a username** by setting `APP_USERNAME` (defaults to `admin`).

> `.env.local` is gitignored — it holds your only credentials and must never be
> committed or shared.

### 3. Run it
```bash
npm run dev
```
Open <http://localhost:3000>, sign in, and start mapping. The database file is
created automatically at `data/data.db` on first use.

### Available scripts
| Script                         | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `npm run dev`                  | Start the dev server (hot reload)        |
| `npm run build`                | Production build                         |
| `npm start`                    | Run the production build                 |
| `npm run lint`                 | Run ESLint                               |
| `npm run hash-password "pw"`   | Print a base64 bcrypt hash for `.env.local` |

---

## Your data

- Stored in a single SQLite file at **`data/data.db`** (override with `DATA_DIR`).
- The `data/` folder is gitignored — your data is never committed.
- **Back up** by copying `data/data.db` somewhere safe. **Restore** by putting it back.
- **Start fresh** by deleting the `data/` folder; a new empty database is created
  on the next run. (There is no sample/seed data — you start with a blank canvas.)

---

## Project structure

```
NetGraph/
├─ scripts/
│  └─ hash-password.mjs        # CLI to hash a password for .env.local
├─ src/
│  ├─ app/
│  │  ├─ page.js               # "/"  → redirects based on auth
│  │  ├─ app/page.js           # "/app" → the gated application
│  │  ├─ login/                # "/login" page + LoginClient form
│  │  ├─ layout.js             # root layout, fonts, metadata
│  │  ├─ globals.css           # design tokens + global styles
│  │  └─ api/                  # REST route handlers (see TRD)
│  ├─ components/              # AppClient, GraphView, PersonNode, FloatingEdge,
│  │                          # DetailPopup, TableView, MarkdownField, Constellation
│  └─ lib/
│     ├─ db.js                # SQLite schema + data-access functions
│     ├─ session.js           # iron-session config + withAuth wrapper
│     ├─ constants.js         # status & channel definitions
│     └─ edgeGeometry.js      # math for floating edge attachment points
├─ data/                       # SQLite database (gitignored, created at runtime)
├─ .env.local                  # your secrets (gitignored)
└─ .env.example                # template for .env.local
```

---

## Documentation

Detailed design and engineering docs live in [`docs/`](./docs):

- **[Product Requirements (PRD)](./docs/PRD.md)** — what the product is, who it's
  for, goals, features, and non-goals.
- **[Technical Requirements (TRD)](./docs/TRD.md)** — architecture, data model,
  full API reference, auth design, and key technical decisions.
- **[UI / UX](./docs/UI-UX.md)** — design language, colour system, layout,
  components, interactions, and accessibility.
- **[User Flow](./docs/USER-FLOW.md)** — step-by-step walkthroughs of every flow,
  from first-run setup to daily use.

---

## Security notes

- The app is designed for **a single user on their own machine**. There is no
  multi-user support or registration — credentials come solely from `.env.local`.
- Passwords are stored only as a **bcrypt hash**; the plaintext is never persisted.
- The session cookie is **HTTP-only** and **encrypted** (`iron-session`), and is
  marked `secure` in production.
- If you deploy this beyond localhost, serve it over **HTTPS** and use a strong,
  unique `SESSION_SECRET`.

---

## License

Personal project — not currently licensed for redistribution.
