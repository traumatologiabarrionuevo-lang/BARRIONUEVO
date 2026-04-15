"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createUser, updateUser, toggleUser } from "@/server/actions/perfiles.actions";

type Role = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  branchId: string | null;
  branchName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  closingsCount: number;
}

interface Branch { id: string; name: string; }

const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRATIVO: "Administrativo",
  EMPLEADO: "Empleado",
  CONTADOR: "Contador",
  OTRO_ADMINISTRATIVO: "Otro Administrativo",
};

const ROLE_COLORS: Record<Role, string> = {
  ADMINISTRATIVO: "bg-primary/10 text-primary",
  EMPLEADO: "bg-green-100 text-green-700",
  CONTADOR: "bg-purple-100 text-purple-700",
  OTRO_ADMINISTRATIVO: "bg-yellow-100 text-yellow-700",
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: Role;
  branchId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  role: "EMPLEADO",
  branchId: "",
});

const MODULE_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "arqueo", label: "Arqueo de Caja" },
  { key: "cierres", label: "Historial de Cierres" },
  { key: "conciliaciones", label: "Conciliaciones" },
  { key: "auditoria", label: "Auditoría" },
  { key: "perfiles", label: "Perfiles y Permisos" },
  { key: "establecimientos", label: "Establecimientos" },
  { key: "bancos", label: "Cuentas Bancarias" },
];

export function PerfilesManager({
  users,
  branches,
  currentUserId,
}: {
  users: User[];
  branches: Branch[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      branchId: u.branchId ?? "",
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        role: form.role,
        branchId: form.branchId || undefined,
      });
    } else {
      result = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        branchId: form.branchId || undefined,
      });
    }

    if (result.success) {
      setShowForm(false);
      setEditingUser(null);
      router.refresh();
    } else {
      setError(result.error ?? "Error");
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleUser(id, !active);
    router.refresh();
  };

  const inputCls =
    "px-4 py-3 rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-full text-body-md";
  const labelCls = "text-xs font-semibold uppercase tracking-widest text-outline";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {users.length} usuario{users.length !== 1 ? "s" : ""} en el sistema
        </p>
        <Button variant="gold" icon="person_add" onClick={openCreate}>
          Crear Usuario
        </Button>
      </div>

      {/* Formulario crear/editar */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl p-6 border-2 border-primary/20">
          <h3 className="text-body-lg font-semibold text-on-surface mb-4">
            {editingUser ? `Editar — ${editingUser.name}` : "Nuevo Usuario"}
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
                <label className={labelCls}>Nombre Completo *</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="Nombre completo"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Correo Electrónico *</label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  required
                  placeholder="correo@empresa.com"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Contraseña {editingUser ? "(dejar vacío para no cambiar)" : "*"}
                </label>
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  type="password"
                  required={!editingUser}
                  minLength={editingUser ? 0 : 6}
                  placeholder={editingUser ? "Dejar vacío para mantener" : "Mínimo 6 caracteres"}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Rol *</label>
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value as Role)}
                  className={inputCls}
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelCls}>Sucursal Asignada</label>
                <select
                  value={form.branchId}
                  onChange={(e) => set("branchId", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Sin sucursal específica</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <p className="text-xs text-on-surface-variant">
                  Empleados y Contadores pueden acceder a una sucursal. Deja vacío para acceso a todas.
                </p>
              </div>
            </div>

            {/* Módulos visibles por rol */}
            <div className="flex flex-col gap-2 p-4 bg-surface-container-low rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-outline mb-1">
                Módulos — acceso según rol seleccionado
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MODULE_PERMISSIONS.map(({ key, label }) => {
                  const hasAccess =
                    form.role === "ADMINISTRATIVO" ||
                    (form.role === "EMPLEADO" && ["arqueo", "cierres"].includes(key)) ||
                    (form.role === "CONTADOR" && ["dashboard", "cierres", "conciliaciones", "auditoria"].includes(key)) ||
                    (form.role === "OTRO_ADMINISTRATIVO" && ["dashboard", "arqueo", "cierres"].includes(key));
                  return (
                    <div
                      key={key}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        hasAccess
                          ? "bg-green-100 text-green-800"
                          : "bg-surface-container text-outline"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {hasAccess ? "check_circle" : "block"}
                      </span>
                      {label}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Los permisos se asignan automáticamente por rol.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={loading}>
                {editingUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low">
              {["Usuario", "Rol", "Sucursal", "Cierres", "Estado", ""].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-outline">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.id}
                className={`${i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"} hover:bg-surface-container-low/40 transition-colors`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => openEdit(user)}
                        className="text-body-md text-on-surface font-medium hover:text-primary hover:underline transition-colors text-left"
                      >
                        {user.name}
                      </button>
                      <p className="text-body-sm text-outline">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant">
                  {user.branchName ?? <span className="text-outline italic">Todas</span>}
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface monospaced-numbers">
                  {user.closingsCount}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${user.isActive ? "bg-green-100 text-green-700" : "bg-surface-container-high text-outline"}`}>
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                      title="Editar usuario"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleToggle(user.id, user.isActive)}
                        className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                        title={user.isActive ? "Desactivar usuario" : "Activar usuario"}
                      >
                        <span className="material-symbols-outlined text-base">
                          {user.isActive ? "person_off" : "person"}
                        </span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
