import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/session";
import AppClient from "@/components/AppClient";

// Server-side gate: if you're not logged in, you never see the app.
export default async function AppPage() {
  if (!(await isAuthed())) redirect("/login");
  return <AppClient />;
}
