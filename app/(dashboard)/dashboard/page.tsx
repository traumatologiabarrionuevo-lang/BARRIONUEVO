import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/server/queries/dashboard.queries";
import { KPICard } from "@/components/ui/KPICard";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { BranchStatsSection } from "@/components/dashboard/BranchStatsSection";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard — Arqueo Caja Barrionuevo" };

type FilterType = "mes" | "dia" | "semana" | "año" | "rango";

function mondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4, 0, 0, 0);
  const dow = (jan4.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(jan4);
  monday.setDate(4 - dow + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function parseDateRange(params: Record<string, string | string[] | undefined>): {
  start: Date;
  end: Date;
  label: string;
  tipo: FilterType;
  fecha: string;
  semana: string;
  mes: string;
  año: string;
  desde: string;
  hasta: string;
} {
  const get = (k: string) => (Array.isArray(params[k]) ? params[k][0] : params[k]) ?? "";
  const tipo = (get("tipo") || "mes") as FilterType;
  const now = new Date();

  if (tipo === "dia") {
    const fecha = get("fecha") || now.toISOString().split("T")[0];
    const [y, m, d] = fecha.split("-").map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0);
    const end   = new Date(y, m - 1, d, 23, 59, 59);
    const label = start.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Guayaquil" });
    return { start, end, label: label.charAt(0).toUpperCase() + label.slice(1), tipo, fecha, semana: toISOWeek(now), mes: String(now.getMonth() + 1), año: String(now.getFullYear()), desde: "", hasta: "" };
  }

  if (tipo === "semana") {
    const semana = get("semana") || toISOWeek(now);
    const [yearStr, weekPart] = semana.split("-W");
    const y = parseInt(yearStr);
    const w = parseInt(weekPart);
    const monday = mondayOfISOWeek(y, w);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59);
    const fmt = (d: Date) => d.toLocaleDateString("es-EC", { day: "numeric", month: "short", timeZone: "America/Guayaquil" });
    const endFmt = sunday.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Guayaquil" });
    return { start: monday, end: sunday, label: `Semana del ${fmt(monday)} al ${endFmt}`, tipo, fecha: now.toISOString().split("T")[0], semana, mes: String(now.getMonth() + 1), año: String(now.getFullYear()), desde: "", hasta: "" };
  }

  if (tipo === "año") {
    const y = parseInt(get("año") || String(now.getFullYear()));
    const start = new Date(y, 0, 1, 0, 0, 0);
    const end   = new Date(y, 11, 31, 23, 59, 59);
    return { start, end, label: `Año ${y}`, tipo, fecha: now.toISOString().split("T")[0], semana: toISOWeek(now), mes: String(now.getMonth() + 1), año: String(y), desde: "", hasta: "" };
  }

  if (tipo === "rango") {
    const desde = get("desde") || now.toISOString().split("T")[0];
    const hasta = get("hasta") || now.toISOString().split("T")[0];
    const start = new Date(desde + "T00:00:00");
    const end   = new Date(hasta + "T23:59:59");
    const fmt = (d: Date) => d.toLocaleDateString("es-EC", { day: "numeric", month: "short", timeZone: "America/Guayaquil" });
    const endFmt = end.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Guayaquil" });
    return { start, end, label: `${fmt(start)} — ${endFmt}`, tipo, fecha: now.toISOString().split("T")[0], semana: toISOWeek(now), mes: String(now.getMonth() + 1), año: String(now.getFullYear()), desde, hasta };
  }

  // Default: mes
  const m = parseInt(get("mes") || String(now.getMonth() + 1));
  const y = parseInt(get("año") || String(now.getFullYear()));
  const start = new Date(y, m - 1, 1, 0, 0, 0);
  const end   = new Date(y, m, 0, 23, 59, 59);
  const monthName = start.toLocaleDateString("es-EC", { month: "long", year: "numeric", timeZone: "America/Guayaquil" });
  return { start, end, label: monthName.charAt(0).toUpperCase() + monthName.slice(1), tipo: "mes", fecha: now.toISOString().split("T")[0], semana: toISOWeek(now), mes: String(m), año: String(y), desde: "", hasta: "" };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Solo roles con acceso a dashboard
  const role = session.user.role;
  if (role === "EMPLEADO") redirect("/arqueo");

  const params = await searchParams;
  const { start, end, label, tipo, fecha, semana, mes, año, desde, hasta } = parseDateRange(params);
  const stats = await getDashboardStats({ start, end });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Dashboard"
        subtitle={label}
        icon="dashboard"
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

      <div className="p-8 flex flex-col gap-8">

        {/* Filtro de período */}
        <DashboardFilter
          initialTipo={tipo}
          initialFecha={fecha}
          initialSemana={semana}
          initialMes={mes}
          initialAño={año}
          initialDesde={desde}
          initialHasta={hasta}
          label={label}
        />

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total Ingresos"
            value={stats.totalIncome}
            icon="payments"
            trend="up"
            trendLabel={`${stats.closingsCount} cierres en el período`}
            details={[
              { label: "Efectivo",        value: stats.paymentDistribution.cash },
              { label: "Transferencias",  value: stats.paymentDistribution.transfer },
              { label: "T. Débito",       value: stats.paymentDistribution.debitCard },
              { label: "T. Crédito",      value: stats.paymentDistribution.creditCard },
            ]}
          />
          <KPICard
            title="Total Egresos"
            value={stats.totalExpenses}
            icon="money_off"
            trend={stats.totalExpenses > 0 ? "down" : "neutral"}
            trendLabel="Gastos del período"
            variant="default"
          />
          <KPICard
            title="Balance Neto"
            value={stats.netBalance}
            icon="account_balance_wallet"
            variant="primary"
            trend={stats.netBalance >= 0 ? "up" : "down"}
            trendLabel={stats.netBalance >= 0 ? "Balance positivo" : "Balance negativo"}
          />
        </div>

        {/* Gráfica global — Ingresos vs Egresos + Formas de Pago */}
        <DashboardCharts
          monthlyData={stats.monthlyData}
          paymentDistribution={stats.paymentDistribution}
        />

        {/* Branch Stats */}
        <BranchStatsSection branchStats={stats.branchStats} />

        {/* Recent Closings — sin filtro de fecha */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/20">
            <div>
              <h2 className="text-title-md text-on-surface font-bold">Cierres Recientes</h2>
              <p className="text-body-sm text-on-surface-variant mt-0.5">Últimos 10 cierres registrados</p>
            </div>
            <Link
              href="/cierres"
              className="text-primary text-body-sm font-semibold flex items-center gap-1 hover:underline"
            >
              Ver todos
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {stats.recentClosings.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-outline/30">receipt_long</span>
              <p className="text-on-surface-variant text-body-md mt-3">No hay cierres registrados todavía</p>
              <Link
                href="/arqueo"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container text-body-sm font-bold"
              >
                Crear primer arqueo
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low">
                    {["Sucursal", "Empleado", "Fecha", "Total Ingresos", "Egresos", "Conteo Físico", "Diferencia", "Estado"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-label-md font-bold uppercase tracking-widest text-outline">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClosings.map((closing, i) => (
                    <tr
                      key={closing.id}
                      className={`hover:bg-surface-container-low/50 transition-colors ${i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}`}
                    >
                      <td className="px-6 py-4 text-body-md text-on-surface font-medium">{closing.branchName}</td>
                      <td className="px-6 py-4 text-body-md text-on-surface-variant">{closing.closedByName}</td>
                      <td className="px-6 py-4 text-body-md text-on-surface-variant monospaced-numbers">{formatDateTime(closing.closedAt)}</td>
                      <td className="px-6 py-4 text-body-md text-on-surface font-semibold monospaced-numbers">{formatCurrency(closing.totalIncome)}</td>
                      <td className="px-6 py-4 text-body-md text-error monospaced-numbers">
                        {closing.totalExpenses > 0 ? `(${formatCurrency(closing.totalExpenses)})` : "—"}
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface monospaced-numbers">{formatCurrency(closing.totalCashCount ?? 0)}</td>
                      <td className={`px-6 py-4 text-body-md font-semibold monospaced-numbers ${Math.abs(closing.difference) < 0.01 ? "text-green-600" : "text-error"}`}>
                        {closing.difference >= 0 ? "+" : ""}{formatCurrency(closing.difference)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={closing.status as "CUADRADO" | "PENDIENTE" | "CON_DIFERENCIA" | "AUDITADO"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
