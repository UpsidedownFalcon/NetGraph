import { listRelationships, createRelationship, relationshipExists, getPerson } from "@/lib/db";

export async function GET() {
  return Response.json(listRelationships());
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const source = Number(body.source_id);
  const target = Number(body.target_id);

  if (!source || !target) {
    return Response.json({ error: "source_id and target_id are required" }, { status: 400 });
  }
  if (source === target) {
    return Response.json({ error: "Cannot connect a person to themselves" }, { status: 400 });
  }
  if (!getPerson(source) || !getPerson(target)) {
    return Response.json({ error: "Both people must exist" }, { status: 400 });
  }
  if (relationshipExists(source, target)) {
    return Response.json({ error: "That connection already exists" }, { status: 409 });
  }

  const rel = createRelationship({ source_id: source, target_id: target, label: body.label });
  return Response.json(rel, { status: 201 });
} 
