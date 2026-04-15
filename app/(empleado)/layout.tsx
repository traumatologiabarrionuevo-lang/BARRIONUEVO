import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name ?? "Usuario"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
