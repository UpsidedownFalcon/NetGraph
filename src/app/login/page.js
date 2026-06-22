import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/session";
import LoginClient from "./LoginClient";

// If you're already logged in, skip the form and go straight to the app.
export default async function LoginPage() {
  if (await isAuthed()) redirect("/app");
  return <LoginClient />;
}
