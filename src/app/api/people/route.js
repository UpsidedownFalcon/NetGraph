import { listPeople, createPerson } from "@/lib/db";
import { withAuth } from "@/lib/session";

const STATUSES = ["known", "to_contact", "avoid", "friend"];

// GET /api/people  → return the list of all people as JSON
export const GET = withAuth(async () => {
  return Response.json(listPeople());
});

// POST /api/people  → create a new person from the JSON body
export const POST = withAuth(async (request) => {
  // 1. Read & parse the JSON body. If it's malformed, reject with 400.
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // 2. Validate: name is required.
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  // 3. Validate: if a status was given, it must be one of the allowed ones.
  if (body.status && !STATUSES.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  // 4. All good — create the person and return it with 201 Created.
  const person = createPerson({ ...body, name });
  return Response.json(person, { status: 201 });
});
