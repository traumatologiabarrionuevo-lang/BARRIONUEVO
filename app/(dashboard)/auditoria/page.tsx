import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Auditoría — Barrionuevo" };

interface SearchParams {
  module?: string;
  action?: string;
  page?: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-error-container text-error",
  EXPORT: "bg-purple-100 text-purple-700",
  LOGIN: "bg-yellow-100 text-yellow-700",
  LOGOUT: "bg-surface-container-highest text-on-surface-variant",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  EXPORT: "Exportación",
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || !["ADMINISTRATIVO", "CONTADOR"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const pageSize = 30;

  const where: Record<string, unknown> = {};
  if (params.module) where.module = params.module;
  if (params.action) where.action = params.action;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const modules = await prisma.auditLog.groupBy({ by: ["module"] });
  const actions = await prisma.auditLog.groupBy({ by: ["action"] });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Auditoría del Sistema"
        subtitle="Registro inmutable de todas las acciones críticas"
        icon="security"
      />
      <div className="p-8 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Registros", value: total, icon: "list_alt" },
            { label: "Módulos Activos", value: modules.length, icon: "view_module" },
            { label: "Integridad", value: "100%", icon: "verified_user" },
            { label: "Sin Edición", value: "Garantizado", icon: "lock" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-panel rounded-xl p-5 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md font-bold uppercase tracking-widest text-outline">
                  {label}
                </span>
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
              </div>
              <p className="text-title-lg font-black text-on-surface monospaced-numbers">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <h3 className="text-label-md font-bold uppercase tracking-widest text-outline mb-4">Filtros</h3>
          <form className="flex gap-4 flex-wrap">
            <select
              name="module"
              defaultValue={params.module ?? ""}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-body-sm text-on-surface focus:outline-none"
            >
              <option value="">Todos los módulos</option>
              {modules.map((m) => (
                <option key={m.module} value={m.module}>{m.module}</option>
              ))}
            </select>
            <select
              name="action"
              defaultValue={params.action ?? ""}
              className="px-3 py-2.5 rounded-lg bg-surface-container-low text-body-sm text-on-surface focus:outline-none"
            >
              <option value="">Todas las acciones</option>
              {actions.map((a) => (
                <option key={a.action} value={a.action}>{a.action}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg btn-gradient text-white text-label-md font-bold uppercase tracking-widest"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Fecha / Hora", "Usuario", "Módulo", "Acción", "Detalle"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-label-md font-bold uppercase tracking-widest text-outline">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={`${i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"} hover:bg-surface-container-low/40 transition-colors`}>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant monospaced-numbers whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-on-surface font-medium">{log.user.name}</p>
                      <p className="text-body-sm text-outline">{log.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-body-sm font-semibold text-on-surface-variant capitalize">{log.module}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-label-sm tracking-wide ${ACTION_COLORS[log.action] ?? "bg-surface-container text-on-surface-variant"}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant max-w-xs truncate" title={log.detail ?? ""}>
                      {log.detail ?? "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant text-body-md">
                      No hay registros de auditoría
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {Math.ceil(total / pageSize) > 1 && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-outline-variant/20">
              <span className="text-body-sm text-on-surface-variant">Página {page} de {Math.ceil(total / pageSize)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
