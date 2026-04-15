import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/server/queries/dashboard.queries";
import { KPICard } from "@/components/ui/KPICard";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import Link from "next/link";

export const metadata = { title: "Dashboard — Arqueo Caja Barrionuevo" };

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const now = new Date();
  const monthName = now.toLocaleDateString("es-EC", {
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen del mes — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`}
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
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total Ingresos"
            value={stats.totalIncome}
            icon="payments"
            trend="up"
            trendLabel={`${stats.closingsCount} cierres este mes`}
            details={[
              { label: "Efectivo", value: stats.paymentDistribution.cash },
              { label: "Transferencias", value: stats.paymentDistribution.transfer },
              { label: "T. Débito", value: stats.paymentDistribution.debitCard },
              { label: "T. Crédito", value: stats.paymentDistribution.creditCard },
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

        {/* Charts */}
        <DashboardCharts
          monthlyData={stats.monthlyData}
          paymentDistribution={stats.paymentDistribution}
        />

        {/* Recent Closings */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/20">
            <div>
              <h2 className="text-title-md text-on-surface font-bold">
                Cierres Recientes
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Últimos 10 cierres registrados
              </p>
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
              <span className="material-symbols-outlined text-5xl text-outline/30">
                receipt_long
              </span>
              <p className="text-on-surface-variant text-body-md mt-3">
                No hay cierres registrados todavía
              </p>
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
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-label-md font-bold uppercase tracking-widest text-outline"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClosings.map((closing, i) => (
                    <tr
                      key={closing.id}
                      className={`hover:bg-surface-container-low/50 transition-colors ${
                        i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-body-md text-on-surface font-medium">
                          {closing.branchName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface-variant">
                        {closing.closedByName}
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface-variant monospaced-numbers">
                        {formatDateTime(closing.closedAt)}
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface font-semibold monospaced-numbers">
                        {formatCurrency(closing.totalIncome)}
                      </td>
                      <td className="px-6 py-4 text-body-md text-error monospaced-numbers">
                        {closing.totalExpenses > 0 ? `(${formatCurrency(closing.totalExpenses)})` : "—"}
                      </td>
                      <td className="px-6 py-4 text-body-md text-on-surface monospaced-numbers">
                        {formatCurrency(closing.totalCashCount ?? 0)}
                      </td>
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
