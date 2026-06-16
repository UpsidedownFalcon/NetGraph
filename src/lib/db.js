import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// We keep ONE open database connection for the whole app, stored here.
let db;

// Decide where the database file lives: a DATA_DIR env var if set, else ./data
function getDataDir() {
  return process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), "data");
}

// Open the database (creating the file + folder if needed) and ensure the schema exists.
function init() {
  const dir = getDataDir();
  fs.mkdirSync(dir, { recursive: true });        // make the data/ folder if missing
  const file = path.join(dir, "data.db");
  const database = new Database(file);            // open (or create) the SQLite file
  database.pragma("journal_mode = WAL");          // better performance & concurrency
  database.pragma("foreign_keys = ON");           // enforce relationships (used later)

  // Create the people table the first time. "IF NOT EXISTS" makes this safe to run every start.
  database.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      ask          TEXT    NOT NULL DEFAULT '',
      status       TEXT    NOT NULL DEFAULT 'to_contact'
                     CHECK (status IN ('known','to_contact','avoid','friend')),
      background   TEXT    NOT NULL DEFAULT '',
      how_we_met   TEXT    NOT NULL DEFAULT '',
      position_x   REAL    NOT NULL DEFAULT 0,
      position_y   REAL    NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS relationships (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id   INTEGER NOT NULL,
      target_id   INTEGER NOT NULL,
      label       TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES people(id) ON DELETE CASCADE,
      CHECK (source_id <> target_id),
      UNIQUE (source_id, target_id)
    );
    CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_id);
    CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_id);
  `);

  return database;
}

// Return the shared connection, opening it on first use ("lazy singleton").
export function getDb() {
  if (!db) db = init();
  return db;
}

// ---- People: the CRUD functions the rest of the app will call ----

// READ all people, oldest first.
export function listPeople() {
  return getDb().prepare("SELECT * FROM people ORDER BY created_at").all();
}

// READ one person by id (returns undefined if not found).
export function getPerson(id) {
  return getDb().prepare("SELECT * FROM people WHERE id = ?").get(id);
}

// CREATE a new person; fills sensible defaults for anything not provided.
export function createPerson(data) {
  const d = getDb();
  const info = d
    .prepare(
      `INSERT INTO people (name, ask, status, background, how_we_met, position_x, position_y)
       VALUES (@name, @ask, @status, @background, @how_we_met, @position_x, @position_y)`
    )
    .run({
      name: data.name,
      ask: data.ask ?? "",
      status: data.status ?? "to_contact",
      background: data.background ?? "",
      how_we_met: data.how_we_met ?? "",
      position_x: data.position_x ?? 0,
      position_y: data.position_y ?? 0,
    });
  return getPerson(info.lastInsertRowid);
}

// UPDATE only the fields that were passed in.
export function updatePerson(id, data) {
  const d = getDb();
  const allowed = ["name", "ask", "status", "background", "how_we_met", "position_x", "position_y"];
  const fields = allowed.filter((k) => k in data);     // which allowed fields are present?
  if (fields.length === 0) return getPerson(id);        // nothing to change
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");  // e.g. "name = @name, ask = @ask"
  const params = {};
  for (const f of fields) params[f] = data[f];
  params.id = id;
  d.prepare(`UPDATE people SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run(params);
  return getPerson(id);
}

// DELETE a person by id.
export function deletePerson(id) {
  getDb().prepare("DELETE FROM people WHERE id = ?").run(id);
}

// ---- Relationships ----
export function listRelationships() {
  return getDb().prepare("SELECT * FROM relationships ORDER BY id").all();
}

export function createRelationship(data) {
  const d = getDb();
  const info = d
    .prepare(
      `INSERT INTO relationships (source_id, target_id, label)
       VALUES (@source_id, @target_id, @label)`
    )
    .run({ source_id: data.source_id, target_id: data.target_id, label: data.label ?? "" });
  return d.prepare("SELECT * FROM relationships WHERE id = ?").get(info.lastInsertRowid);
}

export function updateRelationship(id, data) {
  const d = getDb();
  if ("label" in data) {
    d.prepare("UPDATE relationships SET label = ? WHERE id = ?").run(data.label, id);
  }
  return d.prepare("SELECT * FROM relationships WHERE id = ?").get(id);
}

export function deleteRelationship(id) {
  getDb().prepare("DELETE FROM relationships WHERE id = ?").run(id);
}

// Quick existence check, used to give a friendly "already exists" error.
export function relationshipExists(sourceId, targetId) {
  return !!getDb()
    .prepare("SELECT 1 FROM relationships WHERE source_id = ? AND target_id = ?")
    .get(sourceId, targetId);
}
