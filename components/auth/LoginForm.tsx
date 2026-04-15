"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";

interface LoginFormData {
  email: string;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        redirect: false,
      });

      if (result?.error) {
        setError("Correo no encontrado o usuario inactivo. Verifica e intenta de nuevo.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error al iniciar sesión. Intenta nuevamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Email */}
      <div className="relative">
        <label className="text-label-md font-bold uppercase tracking-widest text-outline block mb-1.5">
          Correo Electrónico
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 material-symbols-outlined text-outline text-xl">
            mail
          </span>
          <input
            {...register("email", {
              required: "El correo es obligatorio",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido" },
            })}
            type="email"
            placeholder="correo@empresa.com"
            autoComplete="email"
            autoFocus
            className="w-full pl-11 pr-4 py-4 rounded-lg bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline/50 text-body-md"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Error general */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-error-container text-error text-body-sm">
          <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        className="w-full mt-2"
      >
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
