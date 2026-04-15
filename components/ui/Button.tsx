"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary:
        "btn-gradient text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 focus:ring-primary",
      secondary:
        "bg-surface-container-highest text-primary hover:bg-surface-container-high focus:ring-primary",
      gold:
        "bg-secondary-container text-on-secondary-container hover:brightness-95 focus:ring-secondary-container shadow-md",
      ghost:
        "text-on-surface-variant hover:bg-surface-container-low focus:ring-outline-variant",
      danger:
        "bg-error-container text-error hover:bg-red-200 focus:ring-error",
    };

    const sizes = {
      sm: "px-3 py-2 text-xs tracking-wide",
      md: "px-5 py-3 text-xs tracking-widest uppercase",
      lg: "px-6 py-4 text-sm tracking-widest uppercase",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin text-base">
            progress_activity
          </span>
        ) : icon ? (
          <span className="material-symbols-outlined text-base">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
