import { getPerson, createChannel } from "@/lib/db";
import { withAuth } from "@/lib/session";

const CHANNELS = ["whatsapp", "sms", "x", "instagram", "email", "linkedin", "discord", "other"];

// POST /api/people/:id/channels  → add a channel to that person
export const POST = withAuth(async (request, ctx) => {
  const { id } = await ctx.params;
  if (!getPerson(Number(id))) return Response.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!CHANNELS.includes(body.channel)) {
    return Response.json({ error: "Invalid channel" }, { status: 400 });
  }

  const channel = createChannel(Number(id), body);
  return Response.json(channel, { status: 201 });
});
