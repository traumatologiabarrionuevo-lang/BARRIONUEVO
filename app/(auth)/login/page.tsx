import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Iniciar Sesión — Arqueo Caja Barrionuevo",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary-container/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-gradient mb-4 shadow-xl shadow-primary/30">
            <span className="material-symbols-outlined text-white text-3xl">
              account_balance
            </span>
          </div>
          <h1 className="text-headline-sm text-on-surface font-black">
            Arqueo Caja
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Centro de Traumatología y Fisioterapia Barrionuevo
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-2xl shadow-2xl shadow-on-surface/6 p-8 border border-outline-variant/20">
          <div className="mb-6">
            <h2 className="text-title-lg text-on-surface font-bold">
              Iniciar Sesión
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer decoration */}
        <div className="mt-8 flex items-center justify-center gap-2 text-body-sm text-outline">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>Acceso seguro — VALRIMED S.A.S.</span>
        </div>

        {/* Gold progress bar decoration */}
        <div className="mt-4 h-1 rounded-full bg-surface-container-highest overflow-hidden">
          <div className="h-full w-1/3 bg-secondary-container rounded-full" />
        </div>
      </div>
    </div>
  );
}
