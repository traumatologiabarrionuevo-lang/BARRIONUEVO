import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role === "ADMINISTRATIVO" || role === "CONTADOR") {
    redirect("/dashboard");
  }
  redirect("/arqueo");
}
