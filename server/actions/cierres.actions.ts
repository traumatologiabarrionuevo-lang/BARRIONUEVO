"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendCashClosingEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas de validación ────────────────────────────────────────────────────

const DepartmentSchema = z.object({
  name: z.string(),
  cash: z.number().min(0).default(0),
  transfer: z.number().min(0).default(0),
  debitCard: z.number().min(0).default(0),
  creditCard: z.number().min(0).default(0),
  expense: z.number().min(0).default(0),
});

const CashCountSchema = z.object({
  denomination: z.number().positive(),
  quantity: z.number().int().min(0),
  type: z.enum(["BILLETE", "MONEDA"]),
});

const CreateCierreSchema = z.object({
  branchId: z.string().min(1, "Selecciona una sucursal"),
  initialFund: z.number().min(0),
  departments: z.array(DepartmentSchema).min(1),
  cashCounts: z.array(CashCountSchema),
  verifiedTransfer: z.number().min(0).default(0),
  verifiedDebit: z.number().min(0).default(0),
  verifiedCredit: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type CreateCierreInput = z.infer<typeof CreateCierreSchema>;

// ─── Crear cierre de caja ─────────────────────────────────────────────────────

export async function createCierre(input: CreateCierreInput): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "No autenticado" };

  const parsed = CreateCierreSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos: " + parsed.error.message };
  }

  const data = parsed.data;

  // Calcular totales
  const totalIncome = data.departments.reduce(
    (sum, dept) =>
      sum + dept.cash + dept.transfer + dept.debitCard + dept.creditCard,
    0
  );
  const totalExpenses = data.departments.reduce((sum, dept) => sum + dept.expense, 0);
  const totalCashCount = data.cashCounts.reduce(
    (sum, c) => sum + c.denomination * c.quantity,
    0
  );

  // Total verificado = efectivo físico + electrónicos verificados
  const totalVerified = totalCashCount + data.verifiedTransfer + data.verifiedDebit + data.verifiedCredit;
  // Diferencia = verificado total vs reportado en sistema menos gastos
  const totalExpected = totalIncome - totalExpenses;
  const difference = totalVerified - totalExpected;

  const status =
    Math.abs(difference) < 0.01 ? "CUADRADO" : "CON_DIFERENCIA";

  try {
    const closing = await prisma.cashClosing.create({
      data: {
        branchId: data.branchId,
        closedById: session.user.id,
        initialFund: data.initialFund,
        status,
        notes: data.notes,
        totalIncome,
        totalExpenses,
        totalCashCount,
        verifiedTransfer: data.verifiedTransfer,
        verifiedDebit: data.verifiedDebit,
        verifiedCredit: data.verifiedCredit,
        difference,
        departments: {
          create: data.departments.map((dept) => ({
            name: dept.name,
            cash: dept.cash,
            transfer: dept.transfer,
            debitCard: dept.debitCard,
            creditCard: dept.creditCard,
            expense: dept.expense,
            subtotal:
              dept.cash + dept.transfer + dept.debitCard + dept.creditCard - dept.expense,
          })),
        },
        cashCounts: {
          create: data.cashCounts
            .filter((c) => c.quantity > 0)
            .map((c) => ({
              denomination: c.denomination,
              quantity: c.quantity,
              subtotal: c.denomination * c.quantity,
              type: c.type,
            })),
        },
      },
      include: {
        branch: { select: { name: true } },
        closedBy: { select: { name: true } },
      },
    });

    // Auditoría
    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      module: "cierres",
      detail: `Cierre de caja creado — ${closing.branch.name} — Estado: ${status}`,
      branchId: data.branchId,
      cashClosingId: closing.id,
    });

    // Correo automático (no bloquea)
    sendCashClosingEmail({
      branchName: closing.branch.name,
      closedBy: closing.closedBy.name,
      closedAt: closing.closedAt,
      initialFund: data.initialFund,
      totalIncome,
      totalExpenses,
      totalCashCount,
      verifiedTransfer: data.verifiedTransfer,
      verifiedDebit: data.verifiedDebit,
      verifiedCredit: data.verifiedCredit,
      totalVerified,
      difference,
      status,
    }).catch(console.error);

    revalidatePath("/dashboard");
    revalidatePath("/cierres");

    return { success: true, id: closing.id };
  } catch (error) {
    console.error("Error creando cierre:", error);
    return { success: false, error: "Error interno al guardar el cierre" };
  }
}

// ─── Eliminar cierre ──────────────────────────────────────────────────────────

export async function deleteCierre(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "No autenticado" };
  if (session.user.role !== "ADMINISTRATIVO")
    return { success: false, error: "Sin permisos" };

  try {
    const closing = await prisma.cashClosing.findUnique({
      where: { id },
      include: { branch: { select: { name: true } } },
    });
    if (!closing) return { success: false, error: "Cierre no encontrado" };

    await prisma.cashClosing.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      module: "cierres",
      detail: `Cierre eliminado — ${closing.branch.name} — ${closing.closedAt.toISOString()}`,
      branchId: closing.branchId,
    });

    revalidatePath("/cierres");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error eliminando cierre:", error);
    return { success: false, error: "Error al eliminar el cierre" };
  }
}
