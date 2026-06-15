import { getPerson, updatePerson, deletePerson } from "@/lib/db";

const STATUSES = ["known", "to_contact", "avoid", "friend"];

// GET /api/people/:id  → return one person, or 404 if not found
export async function GET(request, ctx) {
  const { id } = await ctx.params;
  const person = getPerson(Number(id));
  if (!person) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(person);
} 

// PATCH /api/people/:id  → update some fields of the person
export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  const existing = getPerson(Number(id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // If a field is provided, validate it. (We only check fields that are present.)
  if ("name" in body && (typeof body.name !== "string" || !body.name.trim())) {
    return Response.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if ("status" in body && !STATUSES.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  if ("name" in body) body.name = body.name.trim();

  return Response.json(updatePerson(Number(id), body));
} 

// DELETE /api/people/:id  → remove the person
export async function DELETE(request, ctx) {
  const { id } = await ctx.params;
  deletePerson(Number(id));
  return Response.json({ ok: true });
} 
