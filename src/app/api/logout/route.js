import { getSession } from "@/lib/session";

// POST /api/logout  → destroy the session cookie.
export async function POST() {
  const session = await getSession();
  session.destroy();
  return Response.json({ authenticated: false });
}
