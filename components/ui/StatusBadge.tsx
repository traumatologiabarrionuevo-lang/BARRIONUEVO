import { cn } from "@/lib/utils";

type Status = "CUADRADO" | "PENDIENTE" | "CON_DIFERENCIA" | "AUDITADO";

const STATUS_CONFIG: Record<
  Status,
  { label: string; className: string; icon: string }
> = {
  CUADRADO: {
    label: "Cuadrado",
    className: "bg-green-100 text-green-700",
    icon: "check_circle",
  },
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700",
    icon: "schedule",
  },
  CON_DIFERENCIA: {
    label: "Con Diferencia",
    className: "bg-error-container text-error",
    icon: "warning",
  },
  AUDITADO: {
    label: "Auditado",
    className: "bg-blue-100 text-blue-700",
    icon: "verified",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDIENTE;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium uppercase tracking-wide",
        config.className,
        className
      )}
    >
      <span className="material-symbols-outlined text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}
