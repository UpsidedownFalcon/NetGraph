import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

// POST /api/login  → check credentials, and on success set the session cookie.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body || {};
  const expectedUser = process.env.APP_USERNAME;

  // The stored hash is base64-encoded (so the $ characters survive .env parsing).
  let expectedHash = "";
  if (process.env.APP_PASSWORD_HASH_B64) {
    try {
      expectedHash = Buffer.from(process.env.APP_PASSWORD_HASH_B64, "base64").toString("utf8");
    } catch {
      expectedHash = "";
    }
  } else if (process.env.APP_PASSWORD_HASH) {
    expectedHash = process.env.APP_PASSWORD_HASH;
  }

  if (!expectedUser || !expectedHash) {
    return Response.json(
      { error: "Server not configured. Set APP_USERNAME and APP_PASSWORD_HASH_B64." },
      { status: 500 }
    );
  }

  // Sanity-check the hash shape so bcrypt can't throw on a corrupted value.
  const looksValid = /^\$2[aby]\$\d{2}\$.{53}$/.test(expectedHash);
  const userOk = typeof username === "string" && username === expectedUser;
  const passOk =
    looksValid && typeof password === "string" && bcrypt.compareSync(password, expectedHash);

  if (!userOk || !passOk) {
    return Response.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  const session = await getSession();
  session.authenticated = true;
  session.username = username;
  await session.save();

  return Response.json({ authenticated: true });
}
