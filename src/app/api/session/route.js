import { isAuthed } from "@/lib/session";

// GET /api/session  → tells the client whether it's currently logged in.
export async function GET() {
  return Response.json({ authenticated: await isAuthed() });
}
