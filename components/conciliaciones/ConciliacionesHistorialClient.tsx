"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { deleteConciliacion } from "@/server/actions/conciliaciones.actions";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DeptDetail {
  denomination: number;
  quantity: number;
  subtotal: number;
  type: string;
}

interface ConciliacionDept {
  id: string;
  department: string;
  label: string;
  systemCashNet: number;
  verifiedCash: number;
  difference: number;
  bankAccountId: string | null;
  details: DeptDetail[];
}

interface ConciliacionItem {
  id: string;
  createdByName: string;
  dateFrom: string;
  dateTo: string;
  difference: number;
  justification: string | null;
  createdAt: string;
  depts: ConciliacionDept[];
}

interface ConciliacionesData {
  total: number;
  pages: number;
  page: number;
  items: ConciliacionItem[];
}

interface Filters {
  dateFrom?: string;
  dateTo?: string;
  page?: string;
}

interface Props {
  data: ConciliacionesData;
  filters: Filters;
  userRole: string;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

const DEPT_ICON: Record<string, string> = {
  traumatologia_fisioterapia: "medical_services",
  farmacia: "local_pharmacy",
  albaran: "receipt",
};

// ─── Exportar CSV ─────────────────────────────────────────────────────────────

function exportCSV(item: ConciliacionItem) {
  const rows: string[] = [];
  rows.push(`"Conciliación Depósito","ID: ${item.id}"`);
  rows.push(`"Período","${formatDateShort(item.dateFrom)} al ${formatDateShort(item.dateTo)}"`);
  rows.push(`"Responsable","${item.createdByName}"`);
  rows.push(`"Fecha de Registro","${formatDate(item.createdAt)}"`);
  rows.push(`"Diferencia Total","${item.difference.toFixed(2)}"`);
  rows.push(``);
  rows.push(`"Departamento","Sistema Neto","Contado","Diferencia"`);
  for (const dept of item.depts) {
    rows.push(`"${dept.label}","${dept.systemCashNet.toFixed(2)}","${dept.verifiedCash.toFixed(2)}","${dept.difference.toFixed(2)}"`);
  }
  rows.push(``);
  rows.push(`"Detalle de Conteo","Departamento","Tipo","Denominación","Cantidad","Subtotal"`);
  for (const dept of item.depts) {
    for (const d of dept.details) {
      rows.push(`"","${dept.label}","${d.type}","${d.denomination.toFixed(2)}","${d.quantity}","${d.subtotal.toFixed(2)}"`);
    }
  }

  const csv = rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conciliacion_${item.id.slice(0, 8)}_${formatDateShort(item.dateFrom)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Exportar PDF (ventana de impresión) ──────────────────────────────────────

function exportPDF(item: ConciliacionItem) {
  const deptsHtml = item.depts.map((dept) => {
    const ok = Math.abs(dept.difference) < 0.01;
    const billetes = dept.details.filter((d) => d.type === "BILLETE");
    const monedas = dept.details.filter((d) => d.type === "MONEDA");
    const denomRows = (items: DeptDetail[]) =>
      items.length === 0
        ? `<tr><td colspan="3" style="color:#999;font-style:italic;padding:4px 8px;">Sin registros</td></tr>`
        : items
            .map(
              (d) =>
                `<tr>
                  <td style="padding:4px 8px;font-family:monospace">${d.type === "BILLETE" ? `$${d.denomination}` : `$${d.denomination.toFixed(2)}`}</td>
                  <td style="padding:4px 8px;text-align:center;font-family:monospace">× ${d.quantity}</td>
                  <td style="padding:4px 8px;text-align:right;font-family:monospace">$${d.subtotal.toFixed(2)}</td>
                </tr>`
            )
            .join("");

    return `
      <div style="margin-bottom:20px;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden">
        <div style="background:#003772;color:white;padding:10px 16px;font-size:13px;font-weight:600">${dept.label}</div>
        <div style="padding:12px 16px">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
            <div style="background:#f5f5f5;border-radius:4px;padding:8px">
              <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.05em">Sistema Neto</div>
              <div style="font-size:15px;font-weight:600;font-family:monospace">$${dept.systemCashNet.toFixed(2)}</div>
            </div>
            <div style="background:#f5f5f5;border-radius:4px;padding:8px">
              <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.05em">Contado</div>
              <div style="font-size:15px;font-weight:600;font-family:monospace">$${dept.verifiedCash.toFixed(2)}</div>
            </div>
            <div style="background:${ok ? "#dcfce7" : "#fee2e2"};border-radius:4px;padding:8px">
              <div style="font-size:10px;color:${ok ? "#166534" : "#991b1b"};text-transform:uppercase;letter-spacing:.05em">${ok ? "Cuadra" : "Diferencia"}</div>
              <div style="font-size:15px;font-weight:600;font-family:monospace;color:${ok ? "#166534" : "#991b1b"}">${dept.difference >= 0 ? "+" : ""}$${dept.difference.toFixed(2)}</div>
            </div>
          </div>
          ${billetes.length > 0 || monedas.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
            <thead><tr style="background:#f0f0f0"><th style="padding:4px 8px;text-align:left">Denominación</th><th style="padding:4px 8px;text-align:center">Cantidad</th><th style="padding:4px 8px;text-align:right">Subtotal</th></tr></thead>
            <tbody>
              ${billetes.length > 0 ? `<tr><td colspan="3" style="padding:4px 8px;font-size:10px;font-weight:600;color:#555;background:#fafafa;text-transform:uppercase">Billetes</td></tr>${denomRows(billetes)}` : ""}
              ${monedas.length > 0 ? `<tr><td colspan="3" style="padding:4px 8px;font-size:10px;font-weight:600;color:#555;background:#fafafa;text-transform:uppercase">Monedas</td></tr>${denomRows(monedas)}` : ""}
            </tbody>
          </table>` : ""}
        </div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Conciliación Depósito</title>
<style>
  body{font-family:Inter,Arial,sans-serif;font-size:13px;color:#1a1a1a;max-width:740px;margin:0 auto;padding:24px}
  @media print{body{padding:0}}
</style>
</head>
<body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
  <div>
    <div style="font-size:20px;font-weight:700;color:#003772">Conciliación Depósito</div>
    <div style="font-size:12px;color:#666;margin-top:2px">Centro de Traumatología y Fisioterapia Barrionuevo — VALRIMED SAS</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#666">
    <div>ID: ${item.id.slice(0, 8).toUpperCase()}</div>
    <div>Registrado: ${formatDate(item.createdAt)}</div>
    <div>Por: ${item.createdByName}</div>
  </div>
</div>
<div style="background:#f0f4fa;border-radius:6px;padding:10px 16px;margin-bottom:16px;font-size:12px">
  <strong>Período:</strong> ${formatDate(item.dateFrom)} al ${formatDate(item.dateTo)} &nbsp;|&nbsp;
  <strong>Diferencia Total:</strong> <span style="color:${Math.abs(item.difference) < 0.01 ? "#166534" : "#991b1b"};font-weight:600">$${item.difference.toFixed(2)}</span>
</div>
${deptsHtml}
<div style="margin-top:32px;border-top:1px solid #e0e0e0;padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:32px">
  <div><div style="font-size:10px;color:#666;margin-bottom:32px">FIRMA RESPONSABLE</div><div style="border-top:1px solid #aaa;padding-top:4px;font-size:11px">${item.createdByName}</div></div>
  <div><div style="font-size:10px;color:#666;margin-bottom:32px">FIRMA CONTADOR / ADMINISTRADOR</div><div style="border-top:1px solid #aaa;padding-top:4px;font-size:11px">&nbsp;</div></div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

function DetailModal({ item, onClose }: { item: ConciliacionItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="btn-gradient rounded-t-2xl px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Conciliación Depósito</h2>
            <p className="text-white/70 text-xs mt-0.5">
              {formatDate(item.dateFrom)} al {formatDate(item.dateTo)} · Por {item.createdByName}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Info general */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-outline mb-1">Período</p>
              <p className="text-sm font-semibold text-on-surface">{formatDateShort(item.dateFrom)} → {formatDateShort(item.dateTo)}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-outline mb-1">Registrado</p>
              <p className="text-sm font-semibold text-on-surface">{formatDate(item.createdAt)}</p>
            </div>
            <div className={`rounded-xl p-4 ${Math.abs(item.difference) < 0.01 ? "bg-green-50" : "bg-error-container"}`}>
              <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${Math.abs(item.difference) < 0.01 ? "text-green-700" : "text-error"}`}>Diferencia Total</p>
              <p className={`text-lg font-semibold monospaced-numbers ${Math.abs(item.difference) < 0.01 ? "text-green-700" : "text-error"}`}>
                {item.difference >= 0 ? "+" : ""}{formatCurrency(item.difference)}
              </p>
            </div>
          </div>

          {/* Departamentos */}
          {item.depts.map((dept) => {
            const ok = Math.abs(dept.difference) < 0.01;
            const billetes = dept.details.filter((d) => d.type === "BILLETE");
            const monedas = dept.details.filter((d) => d.type === "MONEDA");
            const billTotal = billetes.reduce((s, d) => s + d.subtotal, 0);
            const coinTotal = monedas.reduce((s, d) => s + d.subtotal, 0);

            return (
              <div key={dept.id} className="bg-surface-container-lowest rounded-xl overflow-hidden">
                <div className="btn-gradient px-5 py-3.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-base">{DEPT_ICON[dept.department] ?? "business"}</span>
                  <span className="text-white font-medium text-sm">{dept.label}</span>
                  <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${ok ? "bg-green-500 text-white" : "bg-error text-on-error"}`}>
                    {ok ? "Cuadra" : `${dept.difference >= 0 ? "+" : ""}${formatCurrency(dept.difference)}`}
                  </span>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  {/* Resumen financiero */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <p className="text-xs text-outline uppercase tracking-widest mb-1">Sistema Neto</p>
                      <p className="text-base font-semibold text-on-surface monospaced-numbers">{formatCurrency(dept.systemCashNet)}</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3">
                      <p className="text-xs text-outline uppercase tracking-widest mb-1">Contado</p>
                      <p className="text-base font-semibold text-on-surface monospaced-numbers">{formatCurrency(dept.verifiedCash)}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${ok ? "bg-green-50" : "bg-error-container"}`}>
                      <p className={`text-xs uppercase tracking-widest mb-1 ${ok ? "text-green-700" : "text-error"}`}>Diferencia</p>
                      <p className={`text-base font-semibold monospaced-numbers ${ok ? "text-green-700" : "text-error"}`}>
                        {dept.difference >= 0 ? "+" : ""}{formatCurrency(dept.difference)}
                      </p>
                    </div>
                  </div>

                  {/* Detalle conteo */}
                  {(billetes.length > 0 || monedas.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {billetes.length > 0 && (
                        <div className="bg-surface-container-low rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-surface-container flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-outline">payments</span>
                            <span className="text-xs font-semibold uppercase tracking-widest text-outline">Billetes</span>
                            <span className="ml-auto text-xs font-semibold text-on-surface monospaced-numbers">{formatCurrency(billTotal)}</span>
                          </div>
                          <div className="divide-y divide-surface-container">
                            {billetes.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                                <span className="w-10 text-on-surface-variant monospaced-numbers">${d.denomination}</span>
                                <span className="text-outline text-xs">× {d.quantity}</span>
                                <span className="flex-1 text-right text-on-surface monospaced-numbers">{formatCurrency(d.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {monedas.length > 0 && (
                        <div className="bg-surface-container-low rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-surface-container flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-outline">toll</span>
                            <span className="text-xs font-semibold uppercase tracking-widest text-outline">Monedas</span>
                            <span className="ml-auto text-xs font-semibold text-on-surface monospaced-numbers">{formatCurrency(coinTotal)}</span>
                          </div>
                          <div className="divide-y divide-surface-container">
                            {monedas.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                                <span className="w-10 text-on-surface-variant monospaced-numbers">${d.denomination.toFixed(2)}</span>
                                <span className="text-outline text-xs">× {d.quantity}</span>
                                <span className="flex-1 text-right text-on-surface monospaced-numbers">{formatCurrency(d.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => exportCSV(item)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-base">table_view</span>
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => exportPDF(item)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-medium hover:brightness-95 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConciliacionesHistorialClient({ data, filters, userRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [viewItem, setViewItem] = useState<ConciliacionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canDelete = ["ADMINISTRATIVO", "CONTADOR"].includes(userRole);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", "1");
    router.push(`/conciliaciones/historial?${params.toString()}`);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    router.push("/conciliaciones/historial");
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    params.set("page", String(page));
    router.push(`/conciliaciones/historial?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteConciliacion(id);
      if (result.success) {
        router.refresh();
      }
      setDeletingId(null);
      setConfirmDeleteId(null);
    });
  };

  return (
    <>
      {viewItem && <DetailModal item={viewItem} onClose={() => setViewItem(null)} />}

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-xl p-5 mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-outline">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-outline">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={applyFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-gradient text-white text-xs font-medium uppercase tracking-widest hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-base">search</span>
          Filtrar
        </button>
        {(filters.dateFrom || filters.dateTo) && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {data.items.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-3 block">fact_check</span>
          <p className="text-on-surface-variant text-sm">No hay conciliaciones registradas{filters.dateFrom ? " para el período seleccionado" : ""}.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container">
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-outline">Período</th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-outline">Responsable</th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-outline">Departamentos</th>
                <th className="text-right px-5 py-4 text-xs font-semibold uppercase tracking-widest text-outline">Diferencia Total</th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-outline">Fecha</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const totalOk = Math.abs(item.difference) < 0.01;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-surface-container last:border-0 ${isEven ? "" : "bg-surface-container/30"}`}
                  >
                    {/* Período */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-on-surface monospaced-numbers">
                        {formatDateShort(item.dateFrom)} → {formatDateShort(item.dateTo)}
                      </p>
                      <p className="text-xs text-outline mt-0.5 font-mono">{item.id.slice(0, 8).toUpperCase()}</p>
                    </td>

                    {/* Responsable */}
                    <td className="px-5 py-4 text-on-surface-variant">{item.createdByName}</td>

                    {/* Departamentos — badges */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.depts.map((dept) => {
                          const ok = Math.abs(dept.difference) < 0.01;
                          return (
                            <span
                              key={dept.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                            >
                              <span className="material-symbols-outlined text-xs" style={{ fontSize: "11px" }}>
                                {DEPT_ICON[dept.department] ?? "business"}
                              </span>
                              {dept.label.split(" / ")[0]}
                              {!ok && ` ${dept.difference >= 0 ? "+" : ""}${formatCurrency(dept.difference)}`}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Diferencia total */}
                    <td className="px-5 py-4 text-right">
                      <span className={`font-semibold monospaced-numbers ${totalOk ? "text-green-700" : "text-error"}`}>
                        {item.difference >= 0 ? "+" : ""}{formatCurrency(item.difference)}
                      </span>
                    </td>

                    {/* Fecha creación */}
                    <td className="px-5 py-4 text-on-surface-variant text-xs">{formatDate(item.createdAt)}</td>

                    {/* Acciones */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Ver */}
                        <button
                          onClick={() => setViewItem(item)}
                          className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                          title="Ver detalle"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>

                        {/* CSV */}
                        <button
                          onClick={() => exportCSV(item)}
                          className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                          title="Exportar CSV"
                        >
                          <span className="material-symbols-outlined text-base">table_view</span>
                        </button>

                        {/* PDF */}
                        <button
                          onClick={() => exportPDF(item)}
                          className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                          title="Exportar PDF"
                        >
                          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        </button>

                        {/* Eliminar */}
                        {canDelete && (
                          confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id || isPending}
                                className="px-2.5 py-1.5 rounded-lg bg-error text-on-error text-xs font-medium hover:brightness-90 transition-all disabled:opacity-50"
                              >
                                {deletingId === item.id ? "..." : "Confirmar"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="p-2 rounded-lg text-outline hover:text-error hover:bg-error-container transition-all"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )
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
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-outline">
            Página {data.page} de {data.pages} · {data.total} conciliaciones
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => goToPage(data.page - 1)}
              disabled={data.page <= 1}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
              const pg = Math.max(1, Math.min(data.pages - 4, data.page - 2)) + i;
              return (
                <button
                  key={pg}
                  onClick={() => goToPage(pg)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${pg === data.page ? "btn-gradient text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(data.page + 1)}
              disabled={data.page >= data.pages}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
