import { auth } from "@/lib/auth";
import { getCierres } from "@/server/queries/cierres.queries";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { CierresTable } from "@/components/cierres/CierresTable";
import Link from "next/link";

export const metadata = { title: "Historial de Cierres — Barrionuevo" };

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function CierresPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  const isAdmin = session?.user?.role === "ADMINISTRATIVO";
  const userId = isAdmin ? undefined : session?.user?.id;

  const [data, branches] = await Promise.all([
    getCierres({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      branchId: params.branchId,
      status: params.status as "CUADRADO" | "PENDIENTE" | "CON_DIFERENCIA" | "AUDITADO" | undefined,
      page: params.page ? parseInt(params.page) : 1,
      userId,
    }),
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Historial de Cierres"
        subtitle={`${data.total} cierres registrados`}
        icon="receipt_long"
        actions={
          <Link
            href="/arqueo"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-secondary-container text-on-secondary-container font-bold text-xs uppercase tracking-widest hover:brightness-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Nuevo Arqueo
          </Link>
        }
      />
      <div className="p-8">
        <CierresTable
          data={data}
          branches={branches}
          filters={params}
          userRole={session?.user?.role ?? "EMPLEADO"}
        />
      </div>
    </div>
  );
}
