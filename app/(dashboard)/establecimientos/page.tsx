import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { EstablecimientosManager } from "@/components/establecimientos/EstablecimientosManager";

export const metadata = { title: "Establecimientos — Barrionuevo" };

export default async function EstablecimientosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    redirect("/dashboard");
  }

  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { cashClosings: true, users: true } },
    },
  });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Establecimientos"
        subtitle="Gestión de sucursales y puntos de atención"
        icon="store"
      />
      <div className="p-8">
        <EstablecimientosManager
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            address: b.address,
            icon: b.icon,
            isActive: b.isActive,
            createdAt: b.createdAt.toISOString(),
            closingsCount: b._count.cashClosings,
            usersCount: b._count.users,
          }))}
        />
      </div>
    </div>
  );
}
