import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getConciliaciones } from "@/server/queries/conciliaciones.queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConciliacionesHistorialClient } from "@/components/conciliaciones/ConciliacionesHistorialClient";

export const metadata = { title: "Historial de Conciliaciones — Barrionuevo" };

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function ConciliacionesHistorialPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || !["ADMINISTRATIVO", "CONTADOR"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const currentPage = params.page ? parseInt(params.page) : 1;

  const data = await getConciliaciones({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: currentPage,
  });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Historial de Conciliaciones"
        subtitle={`${data.total} conciliaciones registradas`}
        icon="fact_check"
        actions={
          <Link
            href="/conciliaciones"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-secondary-container text-on-secondary-container font-medium text-xs uppercase tracking-widest hover:brightness-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nueva Conciliación
          </Link>
        }
      />
      <div className="p-8">
        <ConciliacionesHistorialClient
          data={data}
          filters={params}
          userRole={session.user.role}
        />
      </div>
    </div>
  );
}
