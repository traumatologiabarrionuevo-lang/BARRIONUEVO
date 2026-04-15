import { prisma } from "@/lib/prisma";

export interface ConciliacionesFilter {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getConciliaciones(filter: ConciliacionesFilter = {}) {
  const { dateFrom, dateTo, page = 1, pageSize = 20 } = filter;

  const where: Record<string, unknown> = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo + "T23:59:59");
  }

  const [total, items] = await Promise.all([
    prisma.reconciliation.count({ where }),
    prisma.reconciliation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: { select: { name: true } },
        depts: {
          include: { details: true },
        },
      },
    }),
  ]);

  const DEPT_LABELS: Record<string, string> = {
    traumatologia_fisioterapia: "Traumatología / Fisioterapia",
    farmacia: "Farmacia",
    albaran: "Albarán",
  };

  return {
    total,
    pages: Math.ceil(total / pageSize),
    page,
    items: items.map((r) => ({
      id: r.id,
      createdByName: r.createdBy.name,
      dateFrom: r.dateFrom.toISOString(),
      dateTo: r.dateTo.toISOString(),
      difference: Number(r.difference),
      justification: r.justification,
      createdAt: r.createdAt.toISOString(),
      depts: r.depts.map((d) => ({
        id: d.id,
        department: d.department,
        label: DEPT_LABELS[d.department] ?? d.department,
        systemCashNet: Number(d.systemCashNet),
        verifiedCash: Number(d.verifiedCash),
        difference: Number(d.difference),
        bankAccountId: d.bankAccountId,
        details: d.details.map((det) => ({
          denomination: Number(det.denomination),
          quantity: det.quantity,
          subtotal: Number(det.subtotal),
          type: det.type,
        })),
      })),
    })),
  };
}
