"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranch,
} from "@/server/actions/establecimientos.actions";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  closingsCount: number;
  usersCount: number;
}

type FormState = { name: string; address: string; icon: string };

const emptyForm = (): FormState => ({ name: "", address: "", icon: "store" });

export function EstablecimientosManager({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingBranch(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (b: Branch) => {
    setEditingBranch(b);
    setForm({ name: b.name, address: b.address ?? "", icon: b.icon ?? "store" });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    setLoading(true);
    const result = editingBranch
      ? await updateBranch(editingBranch.id, form)
      : await createBranch(form);
    if (result.success) {
      setShowForm(false);
      setEditingBranch(null);
      router.refresh();
    } else {
      setError(result.error ?? "Error");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sucursal? Solo es posible si no tiene cierres registrados.")) return;
    const result = await deleteBranch(id);
    if (!result.success) alert(result.error ?? "Error al eliminar");
    else router.refresh();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleBranch(id, !active);
    router.refresh();
  };

  const inputCls =
    "px-4 py-3 rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-full text-body-md";
  const labelCls = "text-xs font-semibold uppercase tracking-widest text-outline";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {branches.length} establecimiento{branches.length !== 1 ? "s" : ""} registrado{branches.length !== 1 ? "s" : ""}
        </p>
        <Button variant="gold" icon="add_circle" onClick={openCreate}>
          Nuevo Establecimiento
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl p-6 border-2 border-primary/20">
          <h3 className="text-body-lg font-semibold text-on-surface mb-4">
            {editingBranch ? `Editar — ${editingBranch.name}` : "Nuevo Establecimiento"}
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
                <label className={labelCls}>Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="Ej: Sur — El Calzado"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Icono (Material Symbol)</label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">{form.icon || "store"}</span>
                  <input
                    value={form.icon}
                    onChange={(e) => set("icon", e.target.value)}
                    placeholder="store"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Dirección</label>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Dirección completa"
                className={inputCls}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={loading}>
                {editingBranch ? "Guardar Cambios" : "Crear"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className={`bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-4 border-2 transition-all ${
              branch.isActive ? "border-transparent" : "border-outline-variant/30 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    {branch.icon ?? "store"}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => openEdit(branch)}
                    className="text-body-md font-semibold text-on-surface hover:text-primary hover:underline transition-colors text-left"
                  >
                    {branch.name}
                  </button>
                  <span className={`text-xs font-medium uppercase px-2 py-0.5 rounded-full block w-fit mt-0.5 ${branch.isActive ? "bg-green-100 text-green-700" : "bg-surface-container-high text-outline"}`}>
                    {branch.isActive ? "Activa" : "Suspendida"}
                  </span>
                </div>
              </div>
            </div>

            {branch.address && (
              <p className="text-body-sm text-on-surface-variant flex items-start gap-1.5">
                <span className="material-symbols-outlined text-outline text-sm mt-0.5">location_on</span>
                {branch.address}
              </p>
            )}

            <div className="flex items-center gap-6 pt-2 border-t border-outline-variant/20">
              <div>
                <p className="text-body-md font-semibold text-on-surface monospaced-numbers">{branch.closingsCount}</p>
                <p className="text-xs text-outline">Cierres</p>
              </div>
              <div>
                <p className="text-body-md font-semibold text-on-surface monospaced-numbers">{branch.usersCount}</p>
                <p className="text-xs text-outline">Usuarios</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-outline-variant/20">
              <button
                onClick={() => openEdit(branch)}
                className="flex-1 py-1.5 rounded-lg text-body-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Editar
              </button>
              <button
                onClick={() => handleToggle(branch.id, branch.isActive)}
                className="flex-1 py-1.5 rounded-lg text-body-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">
                  {branch.isActive ? "pause_circle" : "play_circle"}
                </span>
                {branch.isActive ? "Suspender" : "Activar"}
              </button>
              {branch.closingsCount === 0 && (
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="py-1.5 px-3 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-all"
                  title="Eliminar sucursal"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
