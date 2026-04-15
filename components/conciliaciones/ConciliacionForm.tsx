"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  getSystemTotalsByDept,
  createConciliacion,
  type DeptSystemData,
  type DeptInput,
  type DeptCountDetail,
} from "@/server/actions/conciliaciones.actions";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BILLS = [100, 50, 20, 10, 5, 1];
const COINS = [1.0, 0.5, 0.25, 0.1, 0.05, 0.01];

const DEPT_KEYS = [
  "traumatologia_fisioterapia",
  "farmacia",
  "albaran",
] as const;

type DeptKey = (typeof DEPT_KEYS)[number];

interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderDocument: string;
  department: string | null;
  isActive: boolean;
}

// ─── Estado de conteo por denominación ────────────────────────────────────────

type DenomCounts = Record<string, number>;

const emptyDenomCounts = (): DenomCounts => {
  const obj: DenomCounts = {};
  BILLS.forEach((b) => (obj[`bill_${b}`] = 0));
  COINS.forEach((c) => (obj[`coin_${Math.round(c * 100)}`] = 0));
  return obj;
};

function calcCash(counts: DenomCounts): number {
  const billTotal = BILLS.reduce((s, b) => s + b * (counts[`bill_${b}`] || 0), 0);
  const coinTotal = COINS.reduce((s, c) => s + c * (counts[`coin_${Math.round(c * 100)}`] || 0), 0);
  return billTotal + coinTotal;
}

function buildDetails(counts: DenomCounts): DeptCountDetail[] {
  const details: DeptCountDetail[] = [];
  BILLS.forEach((b) => {
    const qty = counts[`bill_${b}`] || 0;
    if (qty > 0) details.push({ denomination: b, quantity: qty, subtotal: b * qty, type: "BILLETE" });
  });
  COINS.forEach((c) => {
    const qty = counts[`coin_${Math.round(c * 100)}`] || 0;
    if (qty > 0) details.push({ denomination: c, quantity: qty, subtotal: c * qty, type: "MONEDA" });
  });
  return details;
}

// ─── Componente de conteo para un departamento ────────────────────────────────

function DeptCashCounter({
  deptKey,
  systemData,
  bankAccounts,
  counts,
  selectedBankId,
  onChange,
  onBankChange,
}: {
  deptKey: DeptKey;
  systemData: DeptSystemData | null;
  bankAccounts: BankAccount[];
  counts: DenomCounts;
  selectedBankId: string;
  onChange: (counts: DenomCounts) => void;
  onBankChange: (id: string) => void;
}) {
  const verifiedCash = calcCash(counts);
  const systemCashNet = systemData?.systemCashNet ?? 0;
  const difference = verifiedCash - systemCashNet;
  const isBalanced = Math.abs(difference) < 0.01;

  const deptBanks = bankAccounts.filter(
    (b) => b.isActive && (!b.department || b.department === deptKey)
  );
  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);

  const setCount = (key: string, val: number) =>
    onChange({ ...counts, [key]: Math.max(0, val) });

  const billTotal = BILLS.reduce((s, b) => s + b * (counts[`bill_${b}`] || 0), 0);
  const coinTotal = COINS.reduce((s, c) => s + c * (counts[`coin_${Math.round(c * 100)}`] || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Sistema */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-low rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-outline mb-1">Efectivo Ingresado</p>
          <p className="text-lg font-semibold text-on-surface monospaced-numbers">{formatCurrency(systemData?.systemCash ?? 0)}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-outline mb-1">Egresos en Efectivo</p>
          <p className="text-lg font-semibold text-error monospaced-numbers">({formatCurrency(systemData?.systemExpense ?? 0)})</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-primary mb-1">Neto a Depositar</p>
          <p className="text-lg font-semibold text-primary monospaced-numbers">{formatCurrency(systemCashNet)}</p>
        </div>
      </div>

      {/* Conteo físico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Billetes */}
        <div className="bg-surface-container-lowest rounded-xl p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-outline mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">payments</span>
            Billetes
          </h4>
          <div className="flex flex-col gap-1.5">
            {BILLS.map((bill) => {
              const key = `bill_${bill}`;
              const qty = counts[key] || 0;
              return (
                <div key={bill} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low">
                  <span className="w-12 text-body-sm font-medium text-on-surface monospaced-numbers">${bill}</span>
                  <span className="text-outline text-xs">×</span>
                  <input
                    type="number" min="0" step="1" value={qty}
                    onChange={(e) => setCount(key, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-center rounded-md bg-surface-container-lowest text-on-surface monospaced-numbers text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-outline text-xs">=</span>
                  <span className="flex-1 text-right text-sm text-on-surface monospaced-numbers">{formatCurrency(qty * bill)}</span>
                </div>
              );
            })}
            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-primary/10 mt-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Total Billetes</span>
              <span className="text-sm font-semibold text-primary monospaced-numbers">{formatCurrency(billTotal)}</span>
            </div>
          </div>
        </div>

        {/* Monedas */}
        <div className="bg-surface-container-lowest rounded-xl p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-outline mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">toll</span>
            Monedas
          </h4>
          <div className="flex flex-col gap-1.5">
            {COINS.map((coin) => {
              const key = `coin_${Math.round(coin * 100)}`;
              const qty = counts[key] || 0;
              return (
                <div key={coin} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low">
                  <span className="w-12 text-body-sm font-medium text-on-surface monospaced-numbers">${coin.toFixed(2)}</span>
                  <span className="text-outline text-xs">×</span>
                  <input
                    type="number" min="0" step="1" value={qty}
                    onChange={(e) => setCount(key, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-center rounded-md bg-surface-container-lowest text-on-surface monospaced-numbers text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-outline text-xs">=</span>
                  <span className="flex-1 text-right text-sm text-on-surface monospaced-numbers">{formatCurrency(qty * coin)}</span>
                </div>
              );
            })}
            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-primary/10 mt-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Total Monedas</span>
              <span className="text-sm font-semibold text-primary monospaced-numbers">{formatCurrency(coinTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className={`rounded-xl p-5 ${isBalanced ? "bg-green-50 border border-green-200" : "bg-error-container"}`}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${isBalanced ? "text-green-700" : "text-error"}`}>Contado</p>
            <p className={`text-xl font-semibold monospaced-numbers ${isBalanced ? "text-green-700" : "text-error"}`}>{formatCurrency(verifiedCash)}</p>
          </div>
          <div>
            <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${isBalanced ? "text-green-700" : "text-error"}`}>Esperado</p>
            <p className={`text-xl font-semibold monospaced-numbers ${isBalanced ? "text-green-700" : "text-error"}`}>{formatCurrency(systemCashNet)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-base ${isBalanced ? "text-green-600" : "text-error"}`}>
                {isBalanced ? "check_circle" : "warning"}
              </span>
              <p className={`text-xs font-medium uppercase tracking-widest ${isBalanced ? "text-green-700" : "text-error"}`}>
                {isBalanced ? "Cuadra" : "Diferencia"}
              </p>
            </div>
            <p className={`text-xl font-semibold monospaced-numbers ${isBalanced ? "text-green-700" : "text-error"}`}>
              {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
            </p>
          </div>
        </div>
      </div>

      {/* Cuenta de depósito */}
      <div className="bg-surface-container-lowest rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-outline mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">account_balance</span>
          Cuenta para Depósito
        </p>
        {deptBanks.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant italic">
            Sin cuenta asignada — configura en <strong>Cuentas Bancarias</strong>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <select
              value={selectedBankId}
              onChange={(e) => onBankChange(e.target.value)}
              className="px-4 py-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Seleccionar cuenta —</option>
              {deptBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} {b.accountType} · {b.accountNumber} · {b.holderName}
                </option>
              ))}
            </select>
            {selectedBank && (
              <div className="px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container text-body-sm">
                <p className="font-semibold">{selectedBank.bankName} — {selectedBank.accountType}</p>
                <p className="monospaced-numbers">Nº {selectedBank.accountNumber}</p>
                <p>{selectedBank.holderName} · {selectedBank.holderDocument}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Formulario principal ─────────────────────────────────────────────────────

export function ConciliacionForm({
  userId,
  bankAccounts,
}: {
  userId: string;
  bankAccounts: BankAccount[];
}) {
  void userId;
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [systemData, setSystemData] = useState<DeptSystemData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState(false);

  const [counts, setCounts] = useState<Record<DeptKey, DenomCounts>>({
    traumatologia_fisioterapia: emptyDenomCounts(),
    farmacia: emptyDenomCounts(),
    albaran: emptyDenomCounts(),
  });
  const [bankIds, setBankIds] = useState<Record<DeptKey, string>>({
    traumatologia_fisioterapia: "",
    farmacia: "",
    albaran: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const loadSystem = async () => {
    setLoadingSystem(true);
    try {
      const data = await getSystemTotalsByDept({ dateFrom, dateTo });
      setSystemData(data);
      setLoaded(true);
    } catch {
      /* ignore */
    } finally {
      setLoadingSystem(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loaded) return;
    setSubmitting(true);

    const depts: DeptInput[] = DEPT_KEYS.map((key) => {
      const sysData = systemData.find((d) => d.department === key);
      const verifiedCash = calcCash(counts[key]);
      const systemCashNet = sysData?.systemCashNet ?? 0;
      return {
        department: key,
        systemCashNet,
        verifiedCash,
        difference: verifiedCash - systemCashNet,
        bankAccountId: bankIds[key] || undefined,
        details: buildDetails(counts[key]),
      };
    });

    const res = await createConciliacion({ dateFrom, dateTo, depts });
    setResult(res);
    if (res.success) router.refresh();
    setSubmitting(false);
  };

  if (result?.success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
        </div>
        <h2 className="text-xl text-on-surface font-semibold mb-2">¡Conciliación Guardada!</h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          La conciliación de depósito fue registrada correctamente.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            icon="history"
            onClick={() => router.push("/conciliaciones/historial")}
          >
            Ver historial
          </Button>
          <Button
            variant="primary"
            icon="add"
            onClick={() => { setResult(null); setLoaded(false); setCounts({ traumatologia_fisioterapia: emptyDenomCounts(), farmacia: emptyDenomCounts(), albaran: emptyDenomCounts() }); }}
          >
            Nueva Conciliación
          </Button>
        </div>
      </div>
    );
  }

  const DEPT_SECTIONS: { key: DeptKey; label: string; icon: string }[] = [
    { key: "traumatologia_fisioterapia", label: "Traumatología / Fisioterapia", icon: "medical_services" },
    { key: "farmacia", label: "Farmacia", icon: "local_pharmacy" },
    { key: "albaran", label: "Albarán", icon: "receipt" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Período */}
      <div className="bg-surface-container-lowest rounded-xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-outline mb-4">
          Período de Conciliación — Todas las Sucursales
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-outline">Desde</label>
            <input
              type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setLoaded(false); }}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-outline">Hasta</label>
            <input
              type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setLoaded(false); }}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none"
            />
          </div>
          <Button type="button" variant="primary" onClick={loadSystem} loading={loadingSystem} icon="sync">
            Cargar Totales del Sistema
          </Button>
        </div>
        {loaded && (
          <p className="mt-3 text-xs text-green-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Totales cargados para el período {dateFrom} al {dateTo}
          </p>
        )}
      </div>

      {/* Secciones por departamento */}
      {DEPT_SECTIONS.map(({ key, label, icon }) => {
        const sysData = systemData.find((d) => d.department === key) ?? null;
        return (
          <div key={key} className="bg-surface-container-lowest rounded-xl overflow-hidden">
            {/* Header del departamento */}
            <div className="btn-gradient px-6 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-xl">{icon}</span>
              <h3 className="text-white font-medium text-body-lg">{label}</h3>
              {loaded && (
                <span className="ml-auto text-white/70 text-xs">
                  Neto sistema: <span className="font-semibold text-white monospaced-numbers">{formatCurrency(sysData?.systemCashNet ?? 0)}</span>
                </span>
              )}
            </div>
            <div className="p-6">
              {!loaded ? (
                <p className="text-body-sm text-on-surface-variant italic text-center py-4">
                  Carga los totales del sistema primero para ver el efectivo neto de este departamento.
                </p>
              ) : (
                <DeptCashCounter
                  deptKey={key}
                  systemData={sysData}
                  bankAccounts={bankAccounts}
                  counts={counts[key]}
                  selectedBankId={bankIds[key]}
                  onChange={(c) => setCounts((prev) => ({ ...prev, [key]: c }))}
                  onBankChange={(id) => setBankIds((prev) => ({ ...prev, [key]: id }))}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Resumen global */}
      {loaded && (
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-outline mb-4">Resumen Global</h3>
          <div className="grid grid-cols-3 gap-4">
            {DEPT_SECTIONS.map(({ key, label }) => {
              const sysData = systemData.find((d) => d.department === key);
              const verified = calcCash(counts[key]);
              const diff = verified - (sysData?.systemCashNet ?? 0);
              const ok = Math.abs(diff) < 0.01;
              return (
                <div key={key} className={`rounded-xl p-4 ${ok ? "bg-green-50" : "bg-error-container"}`}>
                  <p className={`text-xs font-medium uppercase tracking-widest mb-2 ${ok ? "text-green-700" : "text-error"}`}>{label}</p>
                  <p className={`text-lg font-semibold monospaced-numbers ${ok ? "text-green-700" : "text-error"}`}>
                    {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                  </p>
                  <p className={`text-xs mt-1 ${ok ? "text-green-600" : "text-error"}`}>
                    {ok ? "Cuadra" : "Diferencia"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="flex items-center gap-2 p-4 bg-error-container text-error rounded-xl text-body-sm">
          <span className="material-symbols-outlined text-base">error</span>
          {result.error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" icon="print" onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button type="submit" variant="gold" size="lg" loading={submitting} icon="save" disabled={!loaded}>
          Guardar Conciliación
        </Button>
      </div>
    </form>
  );
}
