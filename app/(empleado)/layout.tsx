import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { getEffectiveModules, type Role } from "@/lib/module-access";

async function getUserAllowedModules(userId: string, role: Role): Promise<string[]> {
  const overrideRecords = await prisma.userPermission.findMany({
    where: {
      userId,
      permission: { action: "view" },
    },
    include: { permission: { select: { module: true } } },
  });

  const overrides: Record<string, boolean> = {};
  for (const record of overrideRecords) {
    overrides[record.permission.module] = record.granted;
  }

  return getEffectiveModules(role, overrides);
}

export default async function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowedModules = await getUserAllowedModules(
    session.user.id,
    session.user.role as Role
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        allowedModules={allowedModules}
        userName={session.user.name ?? "Usuario"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
