import { prisma } from "@/lib/prisma";

type ClosingStatus = "PENDIENTE" | "CUADRADO" | "CON_DIFERENCIA" | "AUDITADO";

export interface CierresFilter {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  userId?: string;
  status?: ClosingStatus;
  page?: number;
  pageSize?: number;
}

export async function getCierres(filter: CierresFilter = {}) {
  const {
    dateFrom,
    dateTo,
    branchId,
    userId,
    status,
    page = 1,
    pageSize = 20,
  } = filter;

  const where: Record<string, unknown> = {};

  if (dateFrom || dateTo) {
    where.closedAt = {};
    if (dateFrom) (where.closedAt as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.closedAt as Record<string, Date>).lte = new Date(dateTo + "T23:59:59");
  }
  if (branchId) where.branchId = branchId;
  if (userId) where.closedById = userId;
  if (status) where.status = status;

  const [total, items] = await Promise.all([
    prisma.cashClosing.count({ where }),
    prisma.cashClosing.findMany({
      where,
      orderBy: { closedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        branch: { select: { name: true, icon: true } },
        closedBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    total,
    pages: Math.ceil(total / pageSize),
    page,
    items: items.map((c) => ({
      id: c.id,
      branchName: c.branch.name,
      branchIcon: c.branch.icon,
      closedByName: c.closedBy.name,
      closedByEmail: c.closedBy.email,
      closedAt: c.closedAt.toISOString(),
      initialFund: Number(c.initialFund),
      totalIncome: Number(c.totalIncome),
      totalExpenses: Number(c.totalExpenses),
      totalCashCount: Number(c.totalCashCount),
      verifiedTransfer: Number(c.verifiedTransfer),
      verifiedDebit: Number(c.verifiedDebit),
      verifiedCredit: Number(c.verifiedCredit),
      difference: Number(c.difference),
      status: c.status,
      notes: c.notes,
    })),
  };
}

export async function getCierreById(id: string) {
  const closing = await prisma.cashClosing.findUnique({
    where: { id },
    include: {
      branch: true,
      closedBy: { select: { name: true, email: true } },
      departments: true,
      expenses: true,
      cashCounts: { orderBy: [{ type: "asc" }, { denomination: "desc" }] },
    },
  });

  if (!closing) return null;

  return {
    ...closing,
    initialFund: Number(closing.initialFund),
    totalIncome: Number(closing.totalIncome),
    totalExpenses: Number(closing.totalExpenses),
    totalCashCount: Number(closing.totalCashCount),
    verifiedTransfer: Number(closing.verifiedTransfer),
    verifiedDebit: Number(closing.verifiedDebit),
    verifiedCredit: Number(closing.verifiedCredit),
    difference: Number(closing.difference),
    departments: closing.departments.map((d) => ({
      ...d,
      cash: Number(d.cash),
      transfer: Number(d.transfer),
      debitCard: Number(d.debitCard),
      creditCard: Number(d.creditCard),
      expense: Number(d.expense),
      subtotal: Number(d.subtotal),
    })),
    expenses: closing.expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    })),
    cashCounts: closing.cashCounts.map((c) => ({
      ...c,
      denomination: Number(c.denomination),
      subtotal: Number(c.subtotal),
    })),
  };
}
