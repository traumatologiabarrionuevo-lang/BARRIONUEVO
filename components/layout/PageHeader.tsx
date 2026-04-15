import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-6 px-8 bg-surface-container-lowest border-b border-outline-variant/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              {icon}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-headline-sm text-on-surface">{title}</h1>
          {subtitle && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
