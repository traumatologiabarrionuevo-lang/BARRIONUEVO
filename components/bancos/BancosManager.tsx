"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  toggleBankAccount,
  type BankAccountInput,
} from "@/server/actions/bancos.actions";

type BankAccount = {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderDocument: string;
  department: string | null;
  isActive: boolean;
  notes: string | null;
};

const DEPT_LABELS: Record<string, string> = {
  traumatologia_fisioterapia: "Traumatología / Fisioterapia",
  farmacia: "Farmacia",
  albaran: "Albarán",
};

const emptyForm = (): BankAccountInput => ({
  bankName: "",
  accountType: "AHORROS",
  accountNumber: "",
  holderName: "",
  holderDocument: "",
  department: "",
  notes: "",
});

export function BancosManager({ accounts }: { accounts: BankAccount[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<BankAccountInput>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof BankAccountInput, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (acc: BankAccount) => {
    setEditing(acc);
    setForm({
      bankName: acc.bankName,
      accountType: acc.accountType,
      accountNumber: acc.accountNumber,
      holderName: acc.holderName,
      holderDocument: acc.holderDocument,
      department: acc.department ?? "",
      notes: acc.notes ?? "",
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = { ...form, department: form.department || undefined };
    const result = editing
      ? await updateBankAccount(editing.id, payload)
      : await createBankAccount(payload);
    if (result.success) {
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } else {
      setError(result.error ?? "Error");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta bancaria? Esta acción no se puede deshacer.")) return;
    await deleteBankAccount(id);
    router.refresh();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleBankAccount(id, !isActive);
    router.refresh();
  };

  const inputCls =
    "px-4 py-3 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 w-full";
  const labelCls = "text-xs font-semibold uppercase tracking-widest text-outline";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""}
        </p>
        <Button variant="gold" icon="add_card" onClick={openCreate}>
          Nueva Cuenta
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl p-6 border-2 border-primary/20">
          <h3 className="text-body-lg font-semibold text-on-surface mb-4">
            {editing ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
          </h3>
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-error-container text-error text-body-sm rounded-lg">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Banco *</label>
                <input
                  value={form.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                  required
                  placeholder="PRODUBANCO, PICHINCHA…"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tipo de Cuenta *</label>
                <select
                  value={form.accountType}
                  onChange={(e) => set("accountType", e.target.value)}
                  className={inputCls}
                >
                  <option value="AHORROS">Ahorros</option>
                  <option value="CORRIENTE">Corriente</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Número de Cuenta *</label>
                <input
                  value={form.accountNumber}
                  onChange={(e) => set("accountNumber", e.target.value)}
                  required
                  placeholder="Nº de cuenta"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Titular *</label>
                <input
                  value={form.holderName}
                  onChange={(e) => set("holderName", e.target.value)}
                  required
                  placeholder="Nombre del titular"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Cédula / RUC</label>
                <input
                  value={form.holderDocument}
                  onChange={(e) => set("holderDocument", e.target.value)}
                  placeholder="Nº de cédula o RUC"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Departamento (depósito de)</label>
                <select
                  value={form.department ?? ""}
                  onChange={(e) => set("department", e.target.value)}
                  className={inputCls}
                >
                  <option value="">General / Sin asignar</option>
                  <option value="traumatologia_fisioterapia">Traumatología / Fisioterapia</option>
                  <option value="farmacia">Farmacia</option>
                  <option value="albaran">Albarán</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelCls}>Notas</label>
                <input
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Información adicional"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={loading}>
                {editing ? "Guardar cambios" : "Crear Cuenta"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Listado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {accounts.length === 0 && (
          <div className="col-span-full py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl text-outline/30 block mb-3">account_balance</span>
            <p className="text-body-md">No hay cuentas bancarias registradas</p>
          </div>
        )}
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={`bg-surface-container-lowest rounded-xl p-5 flex flex-col gap-3 ${!acc.isActive ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{acc.bankName}</p>
                  <p className="text-body-sm text-outline">{acc.accountType}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acc.isActive ? "bg-green-100 text-green-700" : "bg-surface-container text-outline"}`}>
                {acc.isActive ? "Activa" : "Suspendida"}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-body-sm">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-outline">tag</span>
                <span className="monospaced-numbers font-medium text-on-surface">{acc.accountNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-outline">person</span>
                <span>{acc.holderName}</span>
              </div>
              {acc.holderDocument && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-outline">badge</span>
                  <span className="monospaced-numbers">{acc.holderDocument}</span>
                </div>
              )}
              {acc.department && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-outline">category</span>
                  <span className="text-primary font-medium">{DEPT_LABELS[acc.department] ?? acc.department}</span>
                </div>
              )}
              {acc.notes && (
                <p className="text-outline mt-1 italic">{acc.notes}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1 border-t border-outline-variant/20">
              <button
                onClick={() => openEdit(acc)}
                className="flex-1 py-1.5 rounded-lg text-body-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Editar
              </button>
              <button
                onClick={() => handleToggle(acc.id, acc.isActive)}
                className="flex-1 py-1.5 rounded-lg text-body-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">
                  {acc.isActive ? "pause_circle" : "play_circle"}
                </span>
                {acc.isActive ? "Suspender" : "Activar"}
              </button>
              <button
                onClick={() => handleDelete(acc.id)}
                className="py-1.5 px-3 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-all"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
