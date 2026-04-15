import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArqueoWizard } from "@/components/arqueo/ArqueoWizard";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Arqueo de Caja — Barrionuevo" };

export default async function ArqueoPage() {
  const session = await auth();

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, icon: true, address: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader
        title="Arqueo de Caja"
        subtitle="Cierre de caja diario — Sigue los pasos para registrar el arqueo"
        icon="account_balance_wallet"
      />
      <div className="p-8">
        <ArqueoWizard
          branches={branches}
          userName={session?.user?.name ?? ""}
          userEmail={session?.user?.email ?? ""}
        />
      </div>
    </div>
  );
}
