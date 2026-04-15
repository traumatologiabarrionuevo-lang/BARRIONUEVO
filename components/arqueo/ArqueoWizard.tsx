"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { createCierre } from "@/server/actions/cierres.actions";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Branch {
  id: string;
  name: string;
  icon: string | null;
  address: string | null;
}

const DEPARTMENTS = [
  { key: "traumatologia_fisioterapia", label: "Traumatología / Fisioterapia" },
  { key: "farmacia", label: "Farmacia" },
  { key: "albaran", label: "Albarán" },
] as const;

const BILLS = [100, 50, 20, 10, 5, 1];
const COINS = [1.0, 0.5, 0.25, 0.1, 0.05, 0.01];

const STEPS = [
  { id: 1, label: "Sucursal" },
  { id: 2, label: "Identificación" },
  { id: 3, label: "Fondo Inicial" },
  { id: 4, label: "Ingresos" },
  { id: 5, label: "Conteo Físico" },
  { id: 6, label: "Resumen" },
  { id: 7, label: "Confirmar" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema = z.object({ branchId: z.string() });

interface FormData {
  branchId: string;
  initialFund: number;
  traumatologia_fisioterapia_cash: number;
  traumatologia_fisioterapia_transfer: number;
  traumatologia_fisioterapia_debit: number;
  traumatologia_fisioterapia_credit: number;
  traumatologia_fisioterapia_expense: number;
  farmacia_cash: number;
  farmacia_transfer: number;
  farmacia_debit: number;
  farmacia_credit: number;
  farmacia_expense: number;
  albaran_cash: number;
  albaran_transfer: number;
  albaran_debit: number;
  albaran_credit: number;
  albaran_expense: number;
  bill_100: number; bill_50: number; bill_20: number;
  bill_10: number; bill_5: number; bill_1: number;
  coin_100: number; coin_50: number; coin_25: number;
  coin_10: number; coin_5: number; coin_1: number;
  verified_transfer: number;
  verified_debit: number;
  verified_credit: number;
  notes?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEPT_LABELS: Record<string, string> = {
  traumatologia_fisioterapia: "Traumatología / Fisioterapia",
  farmacia: "Farmacia",
  albaran: "Albarán",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ArqueoWizard({
  branches,
  userName,
  userEmail,
}: {
  branches: Branch[];
  userName: string;
  userEmail: string;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    id?: string;
    error?: string;
  } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      initialFund: 0,
      traumatologia_fisioterapia_cash: 0, traumatologia_fisioterapia_transfer: 0,
      traumatologia_fisioterapia_debit: 0, traumatologia_fisioterapia_credit: 0,
      traumatologia_fisioterapia_expense: 0,
      farmacia_cash: 0, farmacia_transfer: 0, farmacia_debit: 0, farmacia_credit: 0,
      farmacia_expense: 0,
      albaran_cash: 0, albaran_transfer: 0, albaran_debit: 0, albaran_credit: 0,
      albaran_expense: 0,
      bill_100: 0, bill_50: 0, bill_20: 0, bill_10: 0, bill_5: 0, bill_1: 0,
      coin_100: 0, coin_50: 0, coin_25: 0, coin_10: 0, coin_5: 0, coin_1: 0,
      verified_transfer: 0, verified_debit: 0, verified_credit: 0,
    },
  });

  const values = watch();

  // ── Calculados en tiempo real ──────────────────────────────────────────────
  const deptTotals = DEPARTMENTS.map(({ key }) => {
    const cash = (values[`${key}_cash` as keyof FormData] as number) || 0;
    const transfer = (values[`${key}_transfer` as keyof FormData] as number) || 0;
    const debit = (values[`${key}_debit` as keyof FormData] as number) || 0;
    const credit = (values[`${key}_credit` as keyof FormData] as number) || 0;
    const expense = (values[`${key}_expense` as keyof FormData] as number) || 0;
    const ingresos = cash + transfer + debit + credit;
    const subtotal = ingresos - expense;
    return { key, cash, transfer, debit, credit, expense, ingresos, subtotal };
  });

  const totalCash = deptTotals.reduce((s, d) => s + d.cash, 0);
  const totalTransfer = deptTotals.reduce((s, d) => s + d.transfer, 0);
  const totalDebit = deptTotals.reduce((s, d) => s + d.debit, 0);
  const totalCredit = deptTotals.reduce((s, d) => s + d.credit, 0);
  const totalExpenses = deptTotals.reduce((s, d) => s + d.expense, 0);
  const totalIncome = deptTotals.reduce((s, d) => s + d.ingresos, 0);
  const totalNeto = deptTotals.reduce((s, d) => s + d.subtotal, 0);

  // Conteo físico
  const billTotal =
    (values.bill_100 || 0) * 100 + (values.bill_50 || 0) * 50 +
    (values.bill_20 || 0) * 20 + (values.bill_10 || 0) * 10 +
    (values.bill_5 || 0) * 5 + (values.bill_1 || 0) * 1;
  const coinTotal =
    (values.coin_100 || 0) * 1.0 + (values.coin_50 || 0) * 0.5 +
    (values.coin_25 || 0) * 0.25 + (values.coin_10 || 0) * 0.1 +
    (values.coin_5 || 0) * 0.05 + (values.coin_1 || 0) * 0.01;
  const totalCashCount = billTotal + coinTotal;

  const verifiedTransfer = values.verified_transfer || 0;
  const verifiedDebit = values.verified_debit || 0;
  const verifiedCredit = values.verified_credit || 0;
  const totalVerified = totalCashCount + verifiedTransfer + verifiedDebit + verifiedCredit;

  const difference = totalVerified - totalNeto;
  const isBalanced = Math.abs(difference) < 0.01;

  const selectedBranch = branches.find((b) => b.id === values.branchId);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const cashCounts = [
        ...BILLS.map((b) => ({
          denomination: b,
          quantity: (data[`bill_${b}` as keyof FormData] as number) || 0,
          type: "BILLETE" as const,
        })),
        ...COINS.map((c) => ({
          denomination: c,
          quantity: (data[`coin_${Math.round(c * 100)}` as keyof FormData] as number) || 0,
          type: "MONEDA" as const,
        })),
      ].filter((c) => c.quantity > 0);

      const result = await createCierre({
        branchId: data.branchId,
        initialFund: data.initialFund,
        departments: DEPARTMENTS.map(({ key }) => ({
          name: key,
          cash: (data[`${key}_cash` as keyof FormData] as number) || 0,
          transfer: (data[`${key}_transfer` as keyof FormData] as number) || 0,
          debitCard: (data[`${key}_debit` as keyof FormData] as number) || 0,
          creditCard: (data[`${key}_credit` as keyof FormData] as number) || 0,
          expense: (data[`${key}_expense` as keyof FormData] as number) || 0,
        })),
        cashCounts,
        verifiedTransfer: data.verified_transfer || 0,
        verifiedDebit: data.verified_debit || 0,
        verifiedCredit: data.verified_credit || 0,
        notes: data.notes,
      });

      setSubmitResult(result);
    } catch {
      setSubmitResult({ success: false, error: "Error inesperado" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitResult?.success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
        </div>
        <h2 className="text-2xl text-on-surface font-bold mb-2">¡Arqueo Registrado!</h2>
        <p className="text-body-md text-on-surface-variant mb-2">
          El cierre de caja se guardó correctamente.
        </p>
        <p className="text-body-sm text-on-surface-variant mb-8">
          Se envió el informe por correo al administrador.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.push("/cierres")} icon="receipt_long">
            Ver historial
          </Button>
          <Button variant="primary" onClick={() => { setSubmitResult(null); setStep(1); }} icon="add_circle">
            Nuevo arqueo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ── Stepper ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10 px-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step === s.id
                  ? "btn-gradient text-white shadow-md shadow-primary/30 scale-110"
                  : step > s.id
                  ? "bg-green-100 text-green-700"
                  : "bg-surface-container-high text-outline"
              }`}>
                {step > s.id ? <span className="material-symbols-outlined text-sm">check</span> : s.id}
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wide hidden sm:block ${
                step === s.id ? "text-primary" : "text-outline"
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                step > s.id ? "bg-green-300" : "bg-surface-container-high"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step Content ────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-8 mb-6 min-h-64">

        {/* Paso 1: Sucursal */}
        {step === 1 && (
          <div>
            <h2 className="text-xl text-on-surface font-semibold mb-1">Selecciona la Sucursal</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              ¿En cuál sucursal estás realizando el cierre de caja?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.map((branch) => (
                <label key={branch.id} className={`relative flex items-start gap-4 p-5 rounded-xl cursor-pointer border-2 transition-all ${
                  values.branchId === branch.id
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low"
                }`}>
                  <input {...register("branchId")} type="radio" value={branch.id} className="sr-only" />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {branch.icon ?? "store"}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-md text-on-surface font-medium">{branch.name}</p>
                    {branch.address && (
                      <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{branch.address}</p>
                    )}
                  </div>
                  {values.branchId === branch.id && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-lg">check_circle</span>
                  )}
                </label>
              ))}
            </div>
            {errors.branchId && (
              <p className="mt-3 text-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.branchId.message}
              </p>
            )}
          </div>
        )}

        {/* Paso 2: Identificación */}
        {step === 2 && (
          <div>
            <h2 className="text-xl text-on-surface font-semibold mb-1">Identificación del Responsable</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Datos del empleado que realiza el cierre de caja.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Nombre del responsable", value: userName },
                { label: "Correo electrónico", value: userEmail },
                { label: "Sucursal", value: selectedBranch?.name ?? "—" },
                {
                  label: "Fecha y Hora",
                  value: new Date().toLocaleString("es-EC", {
                    timeZone: "America/Guayaquil",
                    dateStyle: "short",
                    timeStyle: "short",
                  }),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-outline">{label}</label>
                  <div className="px-4 py-3 rounded-lg bg-surface-container-low text-on-surface text-body-md">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3: Fondo inicial */}
        {step === 3 && (
          <div>
            <h2 className="text-xl text-on-surface font-semibold mb-1">Fondo Inicial de Caja</h2>
            <p className="text-body-md text-on-surface-variant mb-8">
              Ingresa el monto en efectivo con el que inició la caja.
            </p>
            <div className="max-w-sm mx-auto">
              <div className="btn-gradient rounded-2xl p-8 text-center">
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-4">Fondo Inicial</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-white/60 text-2xl">$</span>
                  <input
                    {...register("initialFund", { valueAsNumber: true })}
                    type="number" step="0.01" min="0" placeholder="0.00"
                    className="bg-transparent text-white text-display-md font-bold monospaced-numbers w-40 text-center focus:outline-none placeholder:text-white/30 border-b-2 border-white/30 focus:border-white pb-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 4: Ingresos por departamento */}
        {step === 4 && (
          <div>
            <h2 className="text-xl text-on-surface font-semibold mb-1">Ingresos por Departamento</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Ingresa los valores por departamento y forma de pago. El gasto se descuenta del subtotal.
            </p>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-outline">Departamento</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-outline">Efectivo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-outline">Transferencia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-outline">T. Débito</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-outline">T. Crédito</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-error">Gasto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-primary">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPARTMENTS.map(({ key, label }, i) => {
                    const dept = deptTotals.find((d) => d.key === key)!;
                    return (
                      <tr key={key} className={i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}>
                        <td className="px-4 py-3 text-body-md text-on-surface whitespace-nowrap">{label}</td>
                        {(["cash", "transfer", "debit", "credit"] as const).map((field) => (
                          <td key={field} className="px-4 py-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs">$</span>
                              <input
                                {...register(`${key}_${field}` as keyof FormData, { valueAsNumber: true })}
                                type="number" step="0.01" min="0" placeholder="0.00"
                                className="w-full pl-6 pr-2 py-2 text-right rounded-lg bg-surface-container-low text-on-surface monospaced-numbers text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                          </td>
                        ))}
                        {/* Gasto */}
                        <td className="px-4 py-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-error text-xs">$</span>
                            <input
                              {...register(`${key}_expense` as keyof FormData, { valueAsNumber: true })}
                              type="number" step="0.01" min="0" placeholder="0.00"
                              className="w-full pl-6 pr-2 py-2 text-right rounded-lg bg-red-50 text-error monospaced-numbers text-sm focus:outline-none focus:ring-2 focus:ring-error/20"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-body-md font-semibold text-primary monospaced-numbers">
                          {formatCurrency(dept.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 border-t border-primary/10">
                    <td className="px-4 py-4 text-xs font-semibold uppercase tracking-widest text-primary">Totales</td>
                    <td className="px-4 py-4 text-right text-body-md text-on-surface monospaced-numbers">{formatCurrency(totalCash)}</td>
                    <td className="px-4 py-4 text-right text-body-md text-on-surface monospaced-numbers">{formatCurrency(totalTransfer)}</td>
                    <td className="px-4 py-4 text-right text-body-md text-on-surface monospaced-numbers">{formatCurrency(totalDebit)}</td>
                    <td className="px-4 py-4 text-right text-body-md text-on-surface monospaced-numbers">{formatCurrency(totalCredit)}</td>
                    <td className="px-4 py-4 text-right text-body-md text-error monospaced-numbers">{formatCurrency(totalExpenses)}</td>
                    <td className="px-4 py-4 text-right text-body-md font-semibold text-primary monospaced-numbers">{formatCurrency(totalNeto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Paso 5: Conteo físico */}
        {step === 5 && (
          <div>
            <h2 className="text-xl text-on-surface font-semibold mb-1">Conteo Físico de Efectivo</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Cuenta los billetes y monedas disponibles en la caja.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Billetes */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">payments</span>
                  Billetes
                </h3>
                <div className="flex flex-col gap-2">
                  {BILLS.map((bill) => {
                    const qty = (values[`bill_${bill}` as keyof FormData] as number) || 0;
                    return (
                      <div key={bill} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                        <div className="w-16 text-body-md font-semibold text-on-surface monospaced-numbers">${bill}</div>
                        <span className="text-outline text-body-sm">×</span>
                        <input
                          {...register(`bill_${bill}` as keyof FormData, { valueAsNumber: true })}
                          type="number" min="0" step="1" placeholder="0"
                          className="w-24 px-3 py-2 text-center rounded-lg bg-surface-container-lowest text-on-surface monospaced-numbers text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-outline text-body-sm">=</span>
                        <div className="flex-1 text-right text-body-md text-on-surface monospaced-numbers">
                          {formatCurrency(qty * bill)}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 mt-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Total Billetes</span>
                    <span className="text-body-md font-semibold text-primary monospaced-numbers">{formatCurrency(billTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Monedas */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">toll</span>
                  Monedas
                </h3>
                <div className="flex flex-col gap-2">
                  {COINS.map((coin) => {
                    const fieldKey = `coin_${Math.round(coin * 100)}` as keyof FormData;
                    const qty = (values[fieldKey] as number) || 0;
                    return (
                      <div key={coin} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                        <div className="w-16 text-body-md font-semibold text-on-surface monospaced-numbers">${coin.toFixed(2)}</div>
                        <span className="text-outline text-body-sm">×</span>
                        <input
                          {...register(fieldKey, { valueAsNumber: true })}
                          type="number" min="0" step="1" placeholder="0"
                          className="w-24 px-3 py-2 text-center rounded-lg bg-surface-container-lowest text-on-surface monospaced-numbers text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-outline text-body-sm">=</span>
                        <div className="flex-1 text-right text-body-md text-on-surface monospaced-numbers">
                          {formatCurrency(qty * coin)}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 mt-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Total Monedas</span>
                    <span className="text-body-md font-semibold text-primary monospaced-numbers">{formatCurrency(coinTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 btn-gradient rounded-xl p-4 flex items-center justify-between">
              <span className="text-white text-body-md font-medium">Total Efectivo Contado</span>
              <span className="text-white text-lg font-semibold monospaced-numbers">{formatCurrency(totalCashCount)}</span>
            </div>

            {/* Verificación medios electrónicos */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-outline mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">credit_card</span>
                Verificación de Medios Electrónicos
              </h3>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Ingresa el total real recibido por cada medio electrónico según comprobantes del día.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: "verified_transfer" as keyof FormData, label: "Transferencias", icon: "swap_horiz", system: totalTransfer },
                  { key: "verified_debit" as keyof FormData, label: "Tarjetas Débito", icon: "credit_card", system: totalDebit },
                  { key: "verified_credit" as keyof FormData, label: "Tarjetas Crédito", icon: "payments", system: totalCredit },
                ].map(({ key, label, icon, system }) => {
                  const val = (values[key] as number) || 0;
                  const diff = val - system;
                  return (
                    <div key={key} className="bg-surface-container-low rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                        <p className="text-xs font-semibold uppercase tracking-widest text-outline">{label}</p>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-2">
                        Sistema: <span className="font-medium monospaced-numbers">{formatCurrency(system)}</span>
                      </p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs">$</span>
                        <input
                          {...register(key, { valueAsNumber: true })}
                          type="number" step="0.01" min="0" placeholder="0.00"
                          className="w-full pl-6 pr-2 py-3 text-right rounded-lg bg-surface-container-lowest text-on-surface monospaced-numbers text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      {val > 0 && (
                        <p className={`text-xs mt-1 text-right monospaced-numbers font-medium ${Math.abs(diff) < 0.01 ? "text-green-600" : "text-error"}`}>
                          {Math.abs(diff) < 0.01 ? "✓ Coincide" : diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 bg-secondary-container rounded-xl p-4 flex items-center justify-between">
                <span className="text-on-secondary-container text-body-md font-medium">Total Verificado (Efectivo + Electrónicos)</span>
                <span className="text-on-secondary-container text-lg font-semibold monospaced-numbers">{formatCurrency(totalVerified)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Paso 6: Resumen */}
        {step === 6 && (
          <div>
            <h2 className="text-xl text-on-surface font-semibold mb-1">Resumen del Cierre</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Verifica los datos antes de confirmar el arqueo.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna izquierda */}
              <div className="flex flex-col gap-4">

                {/* Info general */}
                <div className="bg-surface-container-low rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-outline mb-3">Información General</p>
                  {[
                    { label: "Sucursal", value: selectedBranch?.name ?? "—" },
                    { label: "Responsable", value: userName },
                    { label: "Fondo Inicial", value: formatCurrency(values.initialFund || 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-outline-variant/20 last:border-0">
                      <span className="text-body-sm text-on-surface-variant">{label}</span>
                      <span className="text-body-sm text-on-surface font-medium monospaced-numbers">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Ingresos por departamento */}
                <div className="bg-surface-container-low rounded-xl overflow-hidden">
                  <p className="text-xs font-semibold uppercase tracking-widest text-outline px-5 pt-4 pb-3">
                    Ingresos por Departamento
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container">
                        <th className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-outline">Departamento</th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-outline">Ingresos</th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-error">Gasto</th>
                        <th className="px-5 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-primary">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptTotals.map((dept) => (
                        <tr key={dept.key} className="border-t border-outline-variant/15">
                          <td className="px-5 py-2.5 text-on-surface">{DEPT_LABELS[dept.key]}</td>
                          <td className="px-3 py-2.5 text-right text-on-surface-variant monospaced-numbers">{formatCurrency(dept.ingresos)}</td>
                          <td className="px-3 py-2.5 text-right text-error monospaced-numbers">
                            {dept.expense > 0 ? `(${formatCurrency(dept.expense)})` : "—"}
                          </td>
                          <td className="px-5 py-2.5 text-right text-on-surface font-medium monospaced-numbers">{formatCurrency(dept.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary/5 border-t border-primary/15">
                        <td className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-primary">Total</td>
                        <td className="px-3 py-3 text-right text-on-surface monospaced-numbers">{formatCurrency(totalIncome)}</td>
                        <td className="px-3 py-3 text-right text-error monospaced-numbers">
                          {totalExpenses > 0 ? `(${formatCurrency(totalExpenses)})` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-primary font-semibold monospaced-numbers">{formatCurrency(totalNeto)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Verificación física */}
                <div className="bg-surface-container-low rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-outline mb-3">Verificación Física</p>
                  {[
                    { label: "Efectivo contado (billetes + monedas)", value: formatCurrency(totalCashCount) },
                    { label: "Transferencias verificadas", value: formatCurrency(verifiedTransfer) },
                    { label: "Débito verificado", value: formatCurrency(verifiedDebit) },
                    { label: "Crédito verificado", value: formatCurrency(verifiedCredit) },
                    { label: "Total verificado", value: formatCurrency(totalVerified), highlight: true },
                    { label: "Neto esperado (sistema − gastos)", value: formatCurrency(totalNeto) },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-outline-variant/20 last:border-0">
                      <span className={`text-body-sm ${highlight ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>{label}</span>
                      <span className={`text-body-sm monospaced-numbers ${highlight ? "text-on-surface font-semibold" : "text-on-surface"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna derecha: estado + notas */}
              <div className="flex flex-col gap-4">
                <div className={`rounded-xl p-6 flex flex-col gap-3 ${isBalanced ? "bg-green-50" : "bg-error-container"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-3xl ${isBalanced ? "text-green-600" : "text-error"}`}>
                      {isBalanced ? "check_circle" : "warning"}
                    </span>
                    <div>
                      <p className="text-body-md font-semibold text-on-surface">
                        {isBalanced ? "Caja Cuadrada" : "Caja con Diferencia"}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {isBalanced
                          ? "Los montos coinciden correctamente"
                          : "Hay una diferencia entre lo reportado y lo contado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-on-surface/10">
                    <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Diferencia</span>
                    <span className={`text-2xl font-semibold monospaced-numbers ${isBalanced ? "text-green-600" : "text-error"}`}>
                      {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-outline">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={4}
                    placeholder="Agrega notas o aclaraciones sobre este cierre..."
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 7: Confirmar */}
        {step === 7 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full btn-gradient flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
              <span className="material-symbols-outlined text-white text-4xl">save</span>
            </div>
            <h2 className="text-xl text-on-surface font-semibold mb-3">¿Confirmar el Arqueo?</h2>
            <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-4">
              Al confirmar, se guardará el cierre de caja y se enviará el informe por correo electrónico al administrador.
            </p>
            {submitResult?.error && (
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-error-container text-error rounded-xl text-body-sm mb-4">
                <span className="material-symbols-outlined text-base">error</span>
                {submitResult.error}
              </div>
            )}
            <div className="flex gap-4 justify-center mt-4">
              <Button type="button" variant="secondary" onClick={() => setStep(6)} icon="arrow_back">
                Revisar
              </Button>
              <Button type="submit" variant="gold" size="lg" loading={submitting} icon="check_circle">
                {submitting ? "Guardando..." : "Confirmar y Guardar"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      {step !== 7 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            icon="arrow_back"
          >
            Anterior
          </Button>
          <span className="text-body-sm text-outline">
            Paso {step} de {STEPS.length}
          </span>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              if (step === 1 && !values.branchId) return;
              setStep(Math.min(STEPS.length, step + 1));
            }}
            icon="arrow_forward"
          >
            {step === STEPS.length - 1 ? "Revisar" : "Siguiente"}
          </Button>
        </div>
      )}
    </form>
  );
}
