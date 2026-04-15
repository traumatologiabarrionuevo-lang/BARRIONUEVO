import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { BancosManager } from "@/components/bancos/BancosManager";

export const metadata = { title: "Cuentas Bancarias — Barrionuevo" };

export default async function BancosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO") {
    redirect("/dashboard");
  }

  const accounts = await prisma.bankAccount.findMany({
    orderBy: [{ isActive: "desc" }, { department: "asc" }, { bankName: "asc" }],
  });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Cuentas Bancarias"
        subtitle="Administra las cuentas para depósito por departamento"
        icon="account_balance"
      />
      <div className="p-8">
        <BancosManager
          accounts={accounts.map((a) => ({
            id: a.id,
            bankName: a.bankName,
            accountType: a.accountType,
            accountNumber: a.accountNumber,
            holderName: a.holderName,
            holderDocument: a.holderDocument,
            department: a.department,
            isActive: a.isActive,
            notes: a.notes,
          }))}
        />
      </div>
    </div>
  );
}
