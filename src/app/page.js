import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/session";

// The root URL just routes you to the right place based on auth.
export default async function Home() {
  if (await isAuthed()) redirect("/app");
  redirect("/login");
}
