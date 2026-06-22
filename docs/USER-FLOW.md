# NetGraph — User Flows

This document walks through every user-facing flow, step by step. Each flow notes
what the user does, what they see, and what happens behind the scenes.

---

## Flow 0 — First-time setup (one-off)

**Goal:** get the app running with your own credentials.

1. Install dependencies: `npm install`.
2. Create your secrets file: `cp .env.example .env.local`.
3. Hash your password: `npm run hash-password "your-password"` and paste the printed
   `APP_PASSWORD_HASH_B64=...` line into `.env.local`.
4. Generate a session secret and set `SESSION_SECRET` in `.env.local`.
5. (Optional) change `APP_USERNAME` from `admin`.
6. Start the app: `npm run dev`, then open <http://localhost:3000>.

**Behind the scenes:** on first data access the SQLite database and `data/` folder
are created automatically with an empty schema.

---

## Flow 1 — Logging in

1. Visit `/` (or any page) while logged out.
2. You're redirected to **`/login`**.
3. Enter username + password, click **Sign in**.
   - **Correct:** the server sets an encrypted session cookie; you're sent to `/app`.
   - **Wrong:** an inline "Incorrect username or password" message appears.

**Behind the scenes:** `POST /api/login` checks the username and bcrypt-compares the
password against the stored hash, then saves the session.

---

## Flow 2 — Adding a person

1. On the **Graph** tab, click any empty spot on the canvas.
2. The **detail popup** opens in "create" mode, pre-positioned where you clicked.
3. Fill in at least a **name**; optionally set status, ask, background, how-we-met
   (markdown supported via Write/Preview), and add channels.
4. Click **Add person**.

**Result:** the popup closes and a glowing node appears at that spot.
**Behind the scenes:** `POST /api/people` creates the person; any channels added in
the form are then POSTed to `/api/people/:id/channels`.

---

## Flow 3 — Editing a person

1. Click a node's **dot** → the popup opens in "edit" mode.
2. Change any field. Notes can be toggled between **Write** and **Preview**.
3. Channels save **live** as you add/edit/remove them; other fields save when you
   click **Save**.

**Behind the scenes:** field edits use `PATCH /api/people/:id`; channel changes use
the `/api/people/:id/channels` and `/api/channels/:id` endpoints.

---

## Flow 4 — Managing contact channels

1. In a person's popup, under **CHANNELS**, click **+ Add**.
2. Choose a type (WhatsApp, email, …), type a handle.
3. Toggle **★** to mark a channel as primary; click **×** to remove one.

**Note:** in *edit* mode each change persists immediately; in *create* mode channels
are held locally and saved when the person is created.

---

## Flow 5 — Positioning people

1. Grab a node by its **drag grip** (`⠿`, above the name).
2. Drag it anywhere and release.

**Result:** the node stays where you left it, even after a refresh.
**Behind the scenes:** on drop, `PATCH /api/people/:id` saves `position_x/y`
(optimistically updated in the UI first for smoothness).

---

## Flow 6 — Connecting two people

1. Press on a person's **dot** and drag a wire to another person's dot; release.

**Result:** a directional arrow appears between them.
**Rules:** you can't connect a person to themselves, and duplicate connections are
ignored.
**Behind the scenes:** `POST /api/relationships` with `source_id`/`target_id`.

---

## Flow 7 — Removing a connection

1. Click the arrow to select it.
2. Click the round **×** at its midpoint, or press **Delete**.

**Behind the scenes:** `DELETE /api/relationships/:id`.

---

## Flow 8 — Focusing on someone's network

1. Click a person's **grip** (or search to them).
2. They and their **direct connections** stay bright; everyone else dims, and
   unrelated arrows fade.
3. Press **Esc** (or click empty canvas) to clear the focus.

This answers "who is this person connected to?" visually.

---

## Flow 9 — Searching

1. Type into the **search box** (top-left of the Graph) — a name, a word from any
   note, or a channel handle.
2. Press **Enter**.

**Result:** the canvas smoothly flies to the first match and focuses them.

---

## Flow 10 — Using the table

1. Click the **Table** tab.
2. Edit any cell: click in (it highlights), type, then click away or press **Tab**
   to save. Change status from its dropdown (saves instantly).
3. Delete a person with the row's **Delete** button.

**Result:** switching back to **Graph** reflects every change — both views read the
same data.

---

## Flow 11 — Deleting a person

- From the **graph:** select the node and press **Delete/Backspace**, or
- From the **popup:** click **Delete**, or
- From the **table:** click the row's **Delete** (with a confirm prompt).

**Result:** the person and—via cascading foreign keys—their channels and all their
connections are removed.

---

## Flow 12 — Logging out

1. Click **Log out** (top-right).
2. You're returned to `/login`; the session cookie is destroyed.

**Behind the scenes:** `POST /api/logout`. Afterward, visiting `/app` directly
redirects back to `/login`, and the data APIs return `401`.

---

## Flow 13 — Backing up / resetting

- **Back up:** copy `data/data.db` somewhere safe.
- **Restore:** put that file back in `data/`.
- **Reset:** delete the `data/` folder; a fresh empty database is created on the
  next run.
