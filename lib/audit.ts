"use server";

import { prisma } from "@/lib/prisma";

interface AuditLogInput {
  userId: string;
  action: string;
  module: string;
  detail?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  branchId?: string;
  ipAddress?: string;
  cashClosingId?: string;
  reconciliationId?: string;
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        module: input.module,
        detail: input.detail,
        metadata: input.metadata !== undefined ? JSON.stringify(input.metadata) : undefined,
        branchId: input.branchId,
        ipAddress: input.ipAddress,
        cashClosingId: input.cashClosingId,
        reconciliationId: input.reconciliationId,
      },
    });
  } catch (error) {
    // La auditoría no debe interrumpir el flujo principal
    console.error("[AUDIT ERROR]", error);
  }
}
