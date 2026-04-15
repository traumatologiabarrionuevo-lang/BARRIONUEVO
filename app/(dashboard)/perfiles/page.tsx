import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PerfilesManager } from "@/components/perfiles/PerfilesManager";

export const metadata = { title: "Perfiles y Permisos — Barrionuevo" };

export default async function PerfilesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    redirect("/dashboard");
  }

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        branch: { select: { name: true } },
        _count: { select: { cashClosings: true } },
      },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Perfiles y Permisos"
        subtitle="Gestión de usuarios, roles y accesos al sistema"
        icon="group"
      />
      <div className="p-8">
        <PerfilesManager
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO",
            isActive: u.isActive,
            branchId: u.branchId,
            branchName: u.branch?.name ?? null,
            avatarUrl: u.avatarUrl,
            createdAt: u.createdAt.toISOString(),
            closingsCount: u._count.cashClosings,
          }))}
          branches={branches}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
