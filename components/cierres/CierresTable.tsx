"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { deleteCierre } from "@/server/actions/cierres.actions";
import { useState } from "react";

type Role = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";
type ClosingStatus = "PENDIENTE" | "CUADRADO" | "CON_DIFERENCIA" | "AUDITADO";

interface Cierre {
  id: string;
  branchName: string;
  branchIcon: string | null;
  closedByName: string;
  closedAt: string;
  initialFund: number;
  totalIncome: number;
  totalExpenses: number;
  totalCashCount: number;
  verifiedTransfer: number;
  verifiedDebit: number;
  verifiedCredit: number;
  difference: number;
  status: string;
}

interface CierresData {
  total: number;
  pages: number;
  page: number;
  items: Cierre[];
}

interface Branch {
  id: string;
  name: string;
}

interface CierresTableProps {
  data: CierresData;
  branches: Branch[];
  filters: Record<string, string | undefined>;
  userRole: Role;
}

export function CierresTable({ data, branches, filters, userRole }: CierresTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleting, setDeleting] = useState<string | null>(null);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, [key]: value, page: "1" }).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cierre? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    const result = await deleteCierre(id);
    if (!result.success) alert(result.error ?? "Error al eliminar");
    setDeleting(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <h3 className="text-label-md font-bold uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">filter_list</span>
          Filtros
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold uppercase tracking-widest text-outline">Desde</label>
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold uppercase tracking-widest text-outline">Hasta</label>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {userRole === "ADMINISTRATIVO" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-bold uppercase tracking-widest text-outline">Sucursal</label>
              <select
                value={filters.branchId ?? ""}
                onChange={(e) => updateFilter("branchId", e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todas</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold uppercase tracking-widest text-outline">Estado</label>
            <select
              value={filters.status ?? ""}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos</option>
              <option value="CUADRADO">Cuadrado</option>
              <option value="CON_DIFERENCIA">Con Diferencia</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="AUDITADO">Auditado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/20">
          <p className="text-body-md text-on-surface-variant">
            {data.total} registro{data.total !== 1 ? "s" : ""}
          </p>
        </div>

        {data.items.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline/30">receipt_long</span>
            <p className="text-on-surface-variant text-body-md mt-3">No hay cierres con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Sucursal", "Empleado", "Fecha", "Fondo Inicial", "Total Ingresos", "Total Egresos", "Total Verificado", "Estado", ""].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-label-md font-bold uppercase tracking-widest text-outline whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((cierre, i) => {
                  const totalVerificado = cierre.totalCashCount + cierre.verifiedTransfer + cierre.verifiedDebit + cierre.verifiedCredit;
                  return (
                  <tr
                    key={cierre.id}
                    className={`hover:bg-surface-container-low/50 transition-colors ${i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}`}
                  >
                    <td className="px-4 py-4 text-body-md text-on-surface font-medium whitespace-nowrap">{cierre.branchName}</td>
                    <td className="px-4 py-4 text-body-md text-on-surface-variant whitespace-nowrap">{cierre.closedByName}</td>
                    <td className="px-4 py-4 text-body-md text-on-surface-variant monospaced-numbers whitespace-nowrap">{formatDateTime(cierre.closedAt)}</td>
                    <td className="px-4 py-4 text-body-md text-on-surface monospaced-numbers">{formatCurrency(cierre.initialFund)}</td>
                    <td className="px-4 py-4 text-body-md font-semibold text-on-surface monospaced-numbers">{formatCurrency(cierre.totalIncome)}</td>
                    <td className="px-4 py-4 text-body-md text-error monospaced-numbers">
                      {cierre.totalExpenses > 0 ? `(${formatCurrency(cierre.totalExpenses)})` : "—"}
                    </td>
                    <td className="px-4 py-4 text-body-md font-semibold text-on-surface monospaced-numbers">
                      <span title={`Efectivo: ${formatCurrency(cierre.totalCashCount)} | Transferencia: ${formatCurrency(cierre.verifiedTransfer)} | Débito: ${formatCurrency(cierre.verifiedDebit)} | Crédito: ${formatCurrency(cierre.verifiedCredit)}`}>
                        {formatCurrency(totalVerificado)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={cierre.status as ClosingStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cierres/${cierre.id}`}
                          className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                          title="Ver detalle"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </Link>
                        {userRole === "ADMINISTRATIVO" && (
                          <button
                            onClick={() => handleDelete(cierre.id)}
                            disabled={deleting === cierre.id}
                            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container transition-all disabled:opacity-50"
                            title="Eliminar cierre"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-outline-variant/20">
            <Button
              variant="ghost"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => updateFilter("page", String(data.page - 1))}
              icon="arrow_back"
            >
              Anterior
            </Button>
            <span className="text-body-sm text-on-surface-variant">
              Página {data.page} de {data.pages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={data.page >= data.pages}
              onClick={() => updateFilter("page", String(data.page + 1))}
              icon="arrow_forward"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
