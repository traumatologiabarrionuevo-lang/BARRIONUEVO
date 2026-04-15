"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DeptSystemData {
  department: string;
  label: string;
  systemCash: number;     // suma de dept.cash de cierres en el período
  systemExpense: number;  // suma de dept.expense de cierres en el período
  systemCashNet: number;  // cash - expense
}

export interface DeptCountDetail {
  denomination: number;
  quantity: number;
  subtotal: number;
  type: "BILLETE" | "MONEDA";
}

export interface DeptInput {
  department: string;
  systemCashNet: number;
  verifiedCash: number;
  difference: number;
  bankAccountId?: string;
  details: DeptCountDetail[];
}

// ─── Obtener totales del sistema por departamento ─────────────────────────────

export async function getSystemTotalsByDept({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): Promise<DeptSystemData[]> {
  const from = new Date(dateFrom);
  const to = new Date(dateTo + "T23:59:59");

  const closings = await prisma.cashClosing.findMany({
    where: { closedAt: { gte: from, lte: to } },
    include: { departments: true },
  });

  const DEPTS = [
    { key: "traumatologia_fisioterapia", label: "Traumatología / Fisioterapia" },
    { key: "farmacia", label: "Farmacia" },
    { key: "albaran", label: "Albarán" },
  ];

  return DEPTS.map(({ key, label }) => {
    let systemCash = 0;
    let systemExpense = 0;
    for (const closing of closings) {
      for (const dept of closing.departments) {
        if (dept.name === key) {
          systemCash += Number(dept.cash);
          systemExpense += Number(dept.expense);
        }
      }
    }
    return {
      department: key,
      label,
      systemCash,
      systemExpense,
      systemCashNet: systemCash - systemExpense,
    };
  });
}

// ─── Crear conciliación depósito ─────────────────────────────────────────────

export async function createConciliacion(data: {
  dateFrom: string;
  dateTo: string;
  depts: DeptInput[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "No autenticado" };
  if (!["ADMINISTRATIVO", "CONTADOR"].includes(session.user.role))
    return { success: false, error: "Sin permisos" };

  try {
    const totalDifference = data.depts.reduce((s, d) => s + d.difference, 0);

    const reconciliation = await prisma.reconciliation.create({
      data: {
        createdById: session.user.id,
        dateFrom: new Date(data.dateFrom),
        dateTo: new Date(data.dateTo + "T23:59:59"),
        systemCash: data.depts.reduce((s, d) => s + d.systemCashNet, 0),
        systemTransfer: 0,
        systemDebit: 0,
        systemCredit: 0,
        systemExpenses: 0,
        verifiedCash: data.depts.reduce((s, d) => s + d.verifiedCash, 0),
        verifiedTransfer: 0,
        verifiedDebit: 0,
        verifiedCredit: 0,
        difference: totalDifference,
        depts: {
          create: data.depts.map((dept) => ({
            department: dept.department,
            systemCashNet: dept.systemCashNet,
            verifiedCash: dept.verifiedCash,
            difference: dept.difference,
            bankAccountId: dept.bankAccountId ?? null,
            details: {
              create: dept.details
                .filter((d) => d.quantity > 0)
                .map((d) => ({
                  denomination: d.denomination,
                  quantity: d.quantity,
                  subtotal: d.subtotal,
                  type: d.type,
                })),
            },
          })),
        },
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      module: "conciliaciones",
      detail: `Conciliación depósito creada — Diferencia total: ${totalDifference.toFixed(2)}`,
      reconciliationId: reconciliation.id,
    });

    revalidatePath("/conciliaciones");
    revalidatePath("/conciliaciones/historial");
    return { success: true, id: reconciliation.id };
  } catch (error) {
    console.error("Error creando conciliación:", error);
    return { success: false, error: "Error al guardar la conciliación" };
  }
}

// ─── Eliminar conciliación ────────────────────────────────────────────────────

export async function deleteConciliacion(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || !["ADMINISTRATIVO", "CONTADOR"].includes(session.user.role))
    return { success: false, error: "Sin permisos" };

  try {
    await prisma.reconciliation.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      module: "conciliaciones",
      detail: `Conciliación eliminada: ${id}`,
    });
    revalidatePath("/conciliaciones/historial");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar" };
  }
}
