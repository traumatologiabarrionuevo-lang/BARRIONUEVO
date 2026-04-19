import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Totales del mes actual
  const [incomeAgg, expenseAgg, closingsCount, recentClosings, branchStats] = await Promise.all([
    prisma.cashClosing.aggregate({
      _sum: { totalIncome: true },
      where: { closedAt: { gte: startOfMonth } },
    }),
    prisma.cashClosing.aggregate({
      _sum: { totalExpenses: true },
      where: { closedAt: { gte: startOfMonth } },
    }),
    prisma.cashClosing.count({
      where: { closedAt: { gte: startOfMonth } },
    }),
    prisma.cashClosing.findMany({
      take: 10,
      orderBy: { closedAt: "desc" },
      include: {
        branch: { select: { name: true } },
        closedBy: { select: { name: true } },
      },
    }),
    getBranchStats(startOfMonth),
  ]);

  // Distribución por forma de pago (mes actual)
  const departments = await prisma.closingDepartment.findMany({
    where: { closing: { closedAt: { gte: startOfMonth } } },
  });

  const paymentDistribution = departments.reduce(
    (acc: { cash: number; transfer: number; debitCard: number; creditCard: number }, dept) => {
      acc.cash += Number(dept.cash);
      acc.transfer += Number(dept.transfer);
      acc.debitCard += Number(dept.debitCard);
      acc.creditCard += Number(dept.creditCard);
      return acc;
    },
    { cash: 0, transfer: 0, debitCard: 0, creditCard: 0 }
  );

  // Gráfica mensual (últimos 6 meses)
  const monthlyData = await getMonthlyData(6);

  const totalIncome = Number(incomeAgg._sum.totalIncome ?? 0);
  const totalExpenses = Number(expenseAgg._sum.totalExpenses ?? 0);
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    closingsCount,
    paymentDistribution,
    monthlyData,
    branchStats,
    recentClosings: recentClosings.map((c) => ({
      id: c.id,
      branchName: c.branch.name,
      closedByName: c.closedBy.name,
      closedAt: c.closedAt.toISOString(),
      totalIncome: Number(c.totalIncome),
      totalExpenses: Number(c.totalExpenses),
      totalCashCount: Number(c.totalCashCount),
      difference: Number(c.difference),
      status: c.status,
    })),
  };
}

async function getBranchStats(startOfMonth: Date) {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    branches.map(async (branch) => {
      const [incAgg, expAgg, depts] = await Promise.all([
        prisma.cashClosing.aggregate({
          _sum: { totalIncome: true },
          where: { branchId: branch.id, closedAt: { gte: startOfMonth } },
        }),
        prisma.cashClosing.aggregate({
          _sum: { totalExpenses: true },
          where: { branchId: branch.id, closedAt: { gte: startOfMonth } },
        }),
        prisma.closingDepartment.findMany({
          where: { closing: { branchId: branch.id, closedAt: { gte: startOfMonth } } },
        }),
      ]);

      const totalIncome = Number(incAgg._sum.totalIncome ?? 0);
      const totalExpenses = Number(expAgg._sum.totalExpenses ?? 0);

      const paymentDistribution = depts.reduce(
        (acc: { cash: number; transfer: number; debitCard: number; creditCard: number }, dept) => {
          acc.cash += Number(dept.cash);
          acc.transfer += Number(dept.transfer);
          acc.debitCard += Number(dept.debitCard);
          acc.creditCard += Number(dept.creditCard);
          return acc;
        },
        { cash: 0, transfer: 0, debitCard: 0, creditCard: 0 }
      );

      const monthlyData = await getBranchMonthlyData(branch.id, 6);

      return {
        branchId: branch.id,
        branchName: branch.name,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        paymentDistribution,
        monthlyData,
      };
    })
  );
}

async function getBranchMonthlyData(branchId: string, months: number) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const [inc, exp] = await Promise.all([
      prisma.cashClosing.aggregate({
        _sum: { totalIncome: true },
        where: { branchId, closedAt: { gte: start, lte: end } },
      }),
      prisma.cashClosing.aggregate({
        _sum: { totalExpenses: true },
        where: { branchId, closedAt: { gte: start, lte: end } },
      }),
    ]);

    const monthName = start.toLocaleDateString("es-EC", {
      month: "short",
      timeZone: "America/Guayaquil",
    });

    result.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      income: Number(inc._sum.totalIncome ?? 0),
      expenses: Number(exp._sum.totalExpenses ?? 0),
    });
  }

  return result;
}

async function getMonthlyData(months: number) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const [inc, exp] = await Promise.all([
      prisma.cashClosing.aggregate({
        _sum: { totalIncome: true },
        where: { closedAt: { gte: start, lte: end } },
      }),
      prisma.cashClosing.aggregate({
        _sum: { totalExpenses: true },
        where: { closedAt: { gte: start, lte: end } },
      }),
    ]);

    const monthName = start.toLocaleDateString("es-EC", {
      month: "short",
      timeZone: "America/Guayaquil",
    });

    result.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      income: Number(inc._sum.totalIncome ?? 0),
      expenses: Number(exp._sum.totalExpenses ?? 0),
    });
  }

  return result;
}
