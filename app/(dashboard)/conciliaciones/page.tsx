import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConciliacionForm } from "@/components/conciliaciones/ConciliacionForm";

export const metadata = { title: "Conciliación Depósito — Barrionuevo" };

export default async function ConciliacionesPage() {
  const session = await auth();
  if (!session?.user || !["ADMINISTRATIVO", "CONTADOR"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: [{ department: "asc" }, { bankName: "asc" }],
  });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Conciliación Depósito"
        subtitle="Verificación de efectivo por departamento y preparación de depósitos"
        icon="fact_check"
      />
      <div className="p-8">
        <ConciliacionForm
          userId={session.user.id}
          bankAccounts={bankAccounts.map((b) => ({
            id: b.id,
            bankName: b.bankName,
            accountType: b.accountType,
            accountNumber: b.accountNumber,
            holderName: b.holderName,
            holderDocument: b.holderDocument,
            department: b.department,
            isActive: b.isActive,
          }))}
        />
      </div>
    </div>
  );
}
