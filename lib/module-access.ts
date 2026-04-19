export type Role = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";

export const MODULES = [
  { key: "dashboard",       label: "Dashboard",              icon: "dashboard" },
  { key: "arqueo",          label: "Arqueo de Caja",         icon: "account_balance_wallet" },
  { key: "cierres",         label: "Historial de Cierres",   icon: "receipt_long" },
  { key: "conciliaciones",  label: "Conciliaciones",         icon: "fact_check" },
  { key: "auditoria",       label: "Auditoría",              icon: "security" },
  { key: "perfiles",        label: "Perfiles y Permisos",    icon: "group" },
  { key: "establecimientos",label: "Establecimientos",       icon: "store" },
  { key: "bancos",          label: "Cuentas Bancarias",      icon: "account_balance" },
];

export const ROLE_MODULE_ACCESS: Record<Role, string[]> = {
  ADMINISTRATIVO:      ["dashboard", "arqueo", "cierres", "conciliaciones", "auditoria", "perfiles", "establecimientos", "bancos"],
  EMPLEADO:            ["arqueo", "cierres", "establecimientos"],
  CONTADOR:            ["dashboard", "cierres", "conciliaciones", "auditoria", "establecimientos"],
  OTRO_ADMINISTRATIVO: ["dashboard", "arqueo", "cierres", "conciliaciones", "establecimientos"],
};

export function roleHasModule(role: Role, moduleKey: string): boolean {
  return ROLE_MODULE_ACCESS[role]?.includes(moduleKey) ?? false;
}

export function getEffectiveModules(
  role: Role,
  overrides: Record<string, boolean>
): string[] {
  const effective = new Set(ROLE_MODULE_ACCESS[role] ?? []);
  for (const [moduleKey, granted] of Object.entries(overrides)) {
    if (granted) effective.add(moduleKey);
    else effective.delete(moduleKey);
  }
  return Array.from(effective);
}
