"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type BankAccountInput = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderDocument: string;
  department?: string;
  notes?: string;
};

export async function createBankAccount(
  data: BankAccountInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  if (!data.bankName || !data.accountNumber || !data.holderName)
    return { success: false, error: "Completa los campos requeridos" };

  try {
    const account = await prisma.bankAccount.create({ data });
    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      module: "bancos",
      detail: `Cuenta bancaria creada: ${data.bankName} ${data.accountNumber}`,
    });
    revalidatePath("/bancos");
    revalidatePath("/conciliaciones");
    return { success: true };
  } catch {
    return { success: false, error: "Error al guardar la cuenta" };
  }
}

export async function updateBankAccount(
  id: string,
  data: BankAccountInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  try {
    await prisma.bankAccount.update({ where: { id }, data });
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      module: "bancos",
      detail: `Cuenta bancaria actualizada: ${id}`,
    });
    revalidatePath("/bancos");
    revalidatePath("/conciliaciones");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar la cuenta" };
  }
}

export async function deleteBankAccount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  try {
    await prisma.bankAccount.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      module: "bancos",
      detail: `Cuenta bancaria eliminada: ${id}`,
    });
    revalidatePath("/bancos");
    revalidatePath("/conciliaciones");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar la cuenta" };
  }
}

export async function toggleBankAccount(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  try {
    await prisma.bankAccount.update({ where: { id }, data: { isActive } });
    revalidatePath("/bancos");
    revalidatePath("/conciliaciones");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar" };
  }
}
