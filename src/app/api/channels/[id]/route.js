import { updateChannel, deleteChannel } from "@/lib/db";
import { withAuth } from "@/lib/session";

const CHANNELS = ["whatsapp", "sms", "x", "instagram", "email", "linkedin", "discord", "other"];

// PATCH /api/channels/:id  → edit a channel (any of channel / handle / is_primary)
export const PATCH = withAuth(async (request, ctx) => {
  const { id } = await ctx.params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if ("channel" in body && !CHANNELS.includes(body.channel)) {
    return Response.json({ error: "Invalid channel" }, { status: 400 });
  }
  return Response.json(updateChannel(Number(id), body));
});

// DELETE /api/channels/:id  → remove a channel
export const DELETE = withAuth(async (request, ctx) => {
  const { id } = await ctx.params;
  deleteChannel(Number(id));
  return Response.json({ ok: true });
});
