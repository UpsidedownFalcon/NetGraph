import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// Configuration for the encrypted session cookie.
export const sessionOptions = {
  // The key used to encrypt/decrypt the cookie. MUST be set in .env.local in
  // real use; the fallback only exists so dev doesn't crash if you forget.
  password: process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please-32chars",
  cookieName: "netgraph_session",
  cookieOptions: {
    httpOnly: true,                                  // JS in the browser can't read it
    secure: process.env.NODE_ENV === "production",   // HTTPS-only in production
    sameSite: "lax",
    path: "/",
  },
};

// Read (or start) the session tied to the current request's cookies.
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession(cookieStore, sessionOptions);
}

// True if the current request carries a valid, logged-in session.
export async function isAuthed() {
  const session = await getSession();
  return Boolean(session.authenticated);
}

// Wrap an API route handler so it returns 401 unless authenticated.
// (We'll apply this to all the data routes in Step 17.)
export function withAuth(handler) {
  return async (request, ctx) => {
    if (!(await isAuthed())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(request, ctx);
  };
}
