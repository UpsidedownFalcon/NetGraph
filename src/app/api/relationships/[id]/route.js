import { updateRelationship, deleteRelationship } from "@/lib/db";

// PATCH /api/relationships/:id  → update the relationship (only its label)
export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  return Response.json(updateRelationship(Number(id), body));
}

// DELETE /api/relationships/:id  → remove the relationship
export async function DELETE(request, ctx) {
  const { id } = await ctx.params;
  deleteRelationship(Number(id));
  return Response.json({ ok: true });
} 
