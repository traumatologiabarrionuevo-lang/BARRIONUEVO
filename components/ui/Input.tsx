"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  currency?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, currency, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-md font-bold uppercase tracking-widest text-outline"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-outline text-sm font-medium select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg bg-surface-container-lowest px-4 py-3 text-on-surface",
              "ring-1 ring-outline-variant/30 transition-all duration-150",
              "placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              currency && "monospaced-numbers font-bold text-right pr-4",
              prefix && "pl-8",
              suffix && "pr-8",
              error && "ring-error focus:ring-error",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-outline text-sm font-medium select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
