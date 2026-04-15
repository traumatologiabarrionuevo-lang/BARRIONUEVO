import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCierreById } from "@/server/queries/cierres.queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";

export const metadata = { title: "Detalle de Cierre — Barrionuevo" };

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CUADRADO: { label: "Cuadrado", className: "bg-emerald-100 text-emerald-800" },
  PENDIENTE: { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
  CON_DIFERENCIA: { label: "Con Diferencia", className: "bg-red-100 text-red-800" },
  AUDITADO: { label: "Auditado", className: "bg-blue-100 text-blue-800" },
};

const DEPT_LABELS: Record<string, string> = {
  traumatologia_fisioterapia: "Traumatología / Fisioterapia",
  traumatologia: "Traumatología",
  farmacia: "Farmacia",
  albaran: "Albarán",
  fisioterapia: "Fisioterapia",
};

export default async function CierreDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const cierre = await getCierreById(id);

  if (!cierre) notFound();

  const statusInfo = STATUS_LABELS[cierre.status] ?? {
    label: cierre.status,
    className: "bg-surface-container text-on-surface",
  };

  const balanceOk = Math.abs(cierre.difference) < 0.01;

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title={`Cierre #${cierre.id.slice(-8).toUpperCase()}`}
        subtitle={`${cierre.branch.name} — ${formatDateTime(cierre.closedAt)}`}
        icon="receipt_long"
        actions={
          <Link
            href="/cierres"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold uppercase tracking-widest hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver
          </Link>
        }
      />

      <div className="p-8 space-y-6 max-w-5xl">
        {/* Status + Meta */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-outline mb-2">
              Estado
            </p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-outline mb-1">
              Responsable
            </p>
            <p className="text-sm font-semibold text-on-surface">{cierre.closedBy.name}</p>
            <p className="text-xs text-on-surface-variant">{cierre.closedBy.email}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-outline mb-1">
              Fecha de Cierre
            </p>
            <p className="text-sm font-semibold text-on-surface">{formatDate(cierre.closedAt)}</p>
            <p className="text-xs text-on-surface-variant">
              {new Intl.DateTimeFormat("es-EC", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Guayaquil",
              }).format(new Date(cierre.closedAt))}
            </p>
          </div>
        </div>

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Fondo Inicial", value: cierre.initialFund, icon: "account_balance_wallet", neutral: true },
            { label: "Total Ingresos", value: cierre.totalIncome, icon: "trending_up", positive: true },
            { label: "Total Egresos", value: cierre.totalExpenses, icon: "trending_down", negative: true },
            { label: "Conteo Físico", value: cierre.totalCashCount, icon: "payments", neutral: true },
          ].map((item) => (
            <div key={item.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-outline">
                  {item.label}
                </p>
                <span className={`material-symbols-outlined text-lg ${
                  item.positive ? "text-emerald-600" : item.negative ? "text-error" : "text-primary"
                }`}>
                  {item.icon}
                </span>
              </div>
              <p className={`text-xl font-semibold tabular-nums ${
                item.positive ? "text-emerald-700" : item.negative ? "text-error" : "text-on-surface"
              }`}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Difference Banner */}
        <div
          className={`rounded-xl p-5 flex items-center gap-4 ${
            balanceOk ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${balanceOk ? "text-emerald-600" : "text-error"}`}
          >
            {balanceOk ? "check_circle" : "warning"}
          </span>
          <div>
            <p
              className={`text-sm font-bold ${balanceOk ? "text-emerald-800" : "text-red-800"}`}
            >
              {balanceOk ? "Caja cuadrada" : "Diferencia detectada"}
            </p>
            <p className={`text-xs ${balanceOk ? "text-emerald-700" : "text-red-700"}`}>
              Diferencia:{" "}
              <span className="font-bold tabular-nums">
                {formatCurrency(cierre.difference)}
              </span>
            </p>
          </div>
        </div>

        {/* Departments Table */}
        {cierre.departments.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-high">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-outline">
                Ingresos por Departamento
              </h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-outline">Departamento</th>
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-outline text-right">Efectivo</th>
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-outline text-right">Transferencia</th>
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-outline text-right">Débito</th>
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-outline text-right">Crédito</th>
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-error text-right">Gasto</th>
                  <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-primary text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cierre.departments.map((dept, i) => {
                  const totalIngresos = dept.cash + dept.transfer + dept.debitCard + dept.creditCard;
                  return (
                    <tr key={dept.id} className={i % 2 === 1 ? "bg-surface-container-low/50" : ""}>
                      <td className="px-6 py-4 text-on-surface">{DEPT_LABELS[dept.name] ?? dept.name}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(dept.cash)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(dept.transfer)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(dept.debitCard)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(dept.creditCard)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-error">
                        {dept.expense > 0 ? `(${formatCurrency(dept.expense)})` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums font-medium text-on-surface">{formatCurrency(totalIngresos - dept.expense)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-outline-variant/30 bg-surface-container">
                  <td className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary">Total</td>
                  <td colSpan={4} />
                  <td className="px-6 py-3 text-right tabular-nums text-error">
                    {cierre.totalExpenses > 0 ? `(${formatCurrency(cierre.totalExpenses)})` : "—"}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold text-primary">
                    {formatCurrency(cierre.totalIncome - cierre.totalExpenses)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Cash Count */}
        {cierre.cashCounts.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-high">
              <h2 className="text-[0.7rem] font-bold uppercase tracking-widest text-outline">
                Conteo Físico de Efectivo
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-outline-variant/20">
              {/* Bills */}
              <div>
                <div className="px-6 py-3 bg-surface-container/50 border-b border-outline-variant/20">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-outline">
                    Billetes
                  </p>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="px-6 py-2 text-[0.6rem] font-bold uppercase tracking-wider text-outline">
                        Denominación
                      </th>
                      <th className="px-6 py-2 text-[0.6rem] font-bold uppercase tracking-wider text-outline text-center">
                        Cantidad
                      </th>
                      <th className="px-6 py-2 text-[0.6rem] font-bold uppercase tracking-wider text-outline text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierre.cashCounts
                      .filter((c) => c.type === "BILLETE")
                      .map((c) => (
                        <tr key={c.id} className="border-b border-outline-variant/10">
                          <td className="px-6 py-3 font-medium tabular-nums text-on-surface">
                            $ {c.denomination.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-center tabular-nums text-on-surface-variant">
                            {c.quantity}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-on-surface">
                            {formatCurrency(c.subtotal)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Coins */}
              <div>
                <div className="px-6 py-3 bg-surface-container/50 border-b border-outline-variant/20">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-outline">
                    Monedas
                  </p>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="px-6 py-2 text-[0.6rem] font-bold uppercase tracking-wider text-outline">
                        Denominación
                      </th>
                      <th className="px-6 py-2 text-[0.6rem] font-bold uppercase tracking-wider text-outline text-center">
                        Cantidad
                      </th>
                      <th className="px-6 py-2 text-[0.6rem] font-bold uppercase tracking-wider text-outline text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierre.cashCounts
                      .filter((c) => c.type === "MONEDA")
                      .map((c) => (
                        <tr key={c.id} className="border-b border-outline-variant/10">
                          <td className="px-6 py-3 font-medium tabular-nums text-on-surface">
                            $ {c.denomination.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-center tabular-nums text-on-surface-variant">
                            {c.quantity}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-on-surface">
                            {formatCurrency(c.subtotal)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/20 flex justify-between items-center">
              <p className="text-xs font-semibold text-on-surface uppercase tracking-widest">
                Total Contado en Físico
              </p>
              <p className="text-base font-semibold tabular-nums text-primary">
                {formatCurrency(cierre.totalCashCount)}
              </p>
            </div>
          </div>
        )}

        {/* Verificación Medios Electrónicos */}
        {(cierre.verifiedTransfer > 0 || cierre.verifiedDebit > 0 || cierre.verifiedCredit > 0) && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-high">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-outline">
                Verificación de Medios Electrónicos
              </h2>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {[
                { label: "Transferencias verificadas", value: cierre.verifiedTransfer, icon: "swap_horiz" },
                { label: "Tarjetas Débito verificadas", value: cierre.verifiedDebit, icon: "credit_card" },
                { label: "Tarjetas Crédito verificadas", value: cierre.verifiedCredit, icon: "payments" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                    <span className="text-body-md text-on-surface-variant">{label}</span>
                  </div>
                  <span className="text-body-md text-on-surface tabular-nums font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
              <div className="px-6 py-4 bg-secondary-container/30 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-on-surface">Total Verificado (Efectivo + Electrónicos)</span>
                <span className="text-base font-semibold tabular-nums text-on-surface">
                  {formatCurrency(cierre.totalCashCount + cierre.verifiedTransfer + cierre.verifiedDebit + cierre.verifiedCredit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {cierre.notes && (
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-outline mb-2">
              Notas
            </p>
            <p className="text-sm text-on-surface-variant">{cierre.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
