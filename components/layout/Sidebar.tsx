"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
type Role = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", roles: ["ADMINISTRATIVO", "CONTADOR", "OTRO_ADMINISTRATIVO"] },
  { href: "/arqueo", icon: "account_balance_wallet", label: "Arqueo de Caja", roles: ["EMPLEADO", "ADMINISTRATIVO", "OTRO_ADMINISTRATIVO"] },
  { href: "/cierres", icon: "receipt_long", label: "Historial de Cierres", roles: ["EMPLEADO", "ADMINISTRATIVO", "CONTADOR", "OTRO_ADMINISTRATIVO"] },
  { href: "/conciliaciones", icon: "fact_check", label: "Nueva Conciliación", roles: ["ADMINISTRATIVO", "CONTADOR"] },
  { href: "/conciliaciones/historial", icon: "history", label: "Historial Conciliaciones", roles: ["ADMINISTRATIVO", "CONTADOR"] },
  { href: "/auditoria", icon: "security", label: "Auditoría", roles: ["ADMINISTRATIVO", "CONTADOR"] },
  { href: "/perfiles", icon: "group", label: "Perfiles y Permisos", roles: ["ADMINISTRATIVO"] },
  { href: "/establecimientos", icon: "store", label: "Establecimientos", roles: ["ADMINISTRATIVO"] },
  { href: "/bancos", icon: "account_balance", label: "Cuentas Bancarias", roles: ["ADMINISTRATIVO"] },
];

interface SidebarProps {
  userRole: Role;
  userName: string;
  userEmail: string;
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-primary flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-secondary-container text-lg">
              account_balance
            </span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">
              Arqueo Caja
            </p>
            <p className="text-white/50 text-xs leading-tight">Barrionuevo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/conciliaciones" &&
                pathname.startsWith(item.href)) ||
              (item.href === "/conciliaciones" && pathname === "/conciliaciones");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group",
                    isActive
                      ? "bg-white text-primary font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-xl transition-all",
                      isActive
                        ? "text-primary"
                        : "text-white/60 group-hover:text-white"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-body-md">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span className="text-on-secondary-container text-xs font-black">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-white/50 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-xs"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
