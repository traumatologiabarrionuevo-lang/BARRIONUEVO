import { cn, formatCurrency } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  variant?: "default" | "primary" | "gold";
  subtitle?: string;
  details?: { label: string; value: number }[];
  className?: string;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  variant = "default",
  subtitle,
  details,
  className,
}: KPICardProps) {
  const isNegative = value < 0;

  const cardStyles = {
    default: "bg-surface-container-lowest",
    primary: "btn-gradient text-white",
    gold: "bg-secondary-container",
  };

  const titleStyles = {
    default: "text-outline",
    primary: "text-white/70",
    gold: "text-on-secondary-container",
  };

  const valueStyles = {
    default: isNegative ? "text-error" : "text-on-surface",
    primary: "text-white",
    gold: "text-on-secondary-container",
  };

  const iconStyles = {
    default: "text-primary",
    primary: "text-white/80",
    gold: "text-on-secondary-container",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 flex flex-col gap-3",
        cardStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-label-md font-bold uppercase tracking-widest",
            titleStyles[variant]
          )}
        >
          {title}
        </span>
        <span
          className={cn("material-symbols-outlined text-2xl", iconStyles[variant])}
        >
          {icon}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span
          className={cn(
            "text-display-md font-black monospaced-numbers leading-none",
            valueStyles[variant]
          )}
        >
          {formatCurrency(Math.abs(value))}
        </span>
        {subtitle && (
          <span
            className={cn("text-body-sm", titleStyles[variant])}
          >
            {subtitle}
          </span>
        )}
      </div>

      {details && details.length > 0 && (
        <div className="flex flex-col gap-1 pt-2 border-t border-outline-variant/20">
          {details.map(({ label, value: v }) => (
            <div key={label} className="flex justify-between items-center">
              <span className={cn("text-body-sm", titleStyles[variant])}>{label}</span>
              <span className={cn("text-body-sm font-semibold monospaced-numbers", titleStyles[variant])}>
                {formatCurrency(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {trend && trendLabel && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "material-symbols-outlined text-sm",
              trend === "up" && variant !== "primary" && "text-green-600",
              trend === "down" && "text-error",
              trend === "neutral" && titleStyles[variant],
              variant === "primary" && "text-white/70"
            )}
          >
            {trend === "up"
              ? "trending_up"
              : trend === "down"
              ? "trending_down"
              : "trending_flat"}
          </span>
          <span
            className={cn("text-body-sm", titleStyles[variant])}
          >
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
