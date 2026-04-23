import { prisma } from "@/lib/prisma";

export async function getDashboardStats(dateRange: { start: Date; end: Date }) {
  const { start, end } = dateRange;

  const [incomeAgg, expenseAgg, closingsCount, recentClosings, branchStats] = await Promise.all([
    prisma.cashClosing.aggregate({
      _sum: { totalIncome: true },
      where: { closedAt: { gte: start, lte: end } },
    }),
    prisma.cashClosing.aggregate({
      _sum: { totalExpenses: true },
      where: { closedAt: { gte: start, lte: end } },
    }),
    prisma.cashClosing.count({
      where: { closedAt: { gte: start, lte: end } },
    }),
    // Cierres recientes: sin filtro de fecha, siempre los últimos 10
    prisma.cashClosing.findMany({
      take: 10,
      orderBy: { closedAt: "desc" },
      include: {
        branch: { select: { name: true } },
        closedBy: { select: { name: true } },
      },
    }),
    getBranchStats(start, end),
  ]);

  const departments = await prisma.closingDepartment.findMany({
    where: { closing: { closedAt: { gte: start, lte: end } } },
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

  const chartData = await getChartData(start, end);

  const totalIncome = Number(incomeAgg._sum.totalIncome ?? 0);
  const totalExpenses = Number(expenseAgg._sum.totalExpenses ?? 0);
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    closingsCount,
    paymentDistribution,
    monthlyData: chartData,
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

async function getBranchStats(start: Date, end: Date) {
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
          where: { branchId: branch.id, closedAt: { gte: start, lte: end } },
        }),
        prisma.cashClosing.aggregate({
          _sum: { totalExpenses: true },
          where: { branchId: branch.id, closedAt: { gte: start, lte: end } },
        }),
        prisma.closingDepartment.findMany({
          where: { closing: { branchId: branch.id, closedAt: { gte: start, lte: end } } },
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

      const monthlyData = await getChartDataForBranch(branch.id, start, end);

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

// Determina granularidad según rango y devuelve datos para la gráfica
async function getChartData(start: Date, end: Date) {
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 31) {
    return getDailyData(start, end);
  } else {
    return getMonthlyRangeData(start, end);
  }
}

async function getChartDataForBranch(branchId: string, start: Date, end: Date) {
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 31) {
    return getDailyDataForBranch(branchId, start, end);
  } else {
    return getMonthlyRangeDataForBranch(branchId, start, end);
  }
}

async function getDailyData(start: Date, end: Date) {
  const days: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cur <= endDay) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return Promise.all(
    days.map(async (day) => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
      const dayEnd   = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.cashClosing.aggregate({ _sum: { totalIncome: true },   where: { closedAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.cashClosing.aggregate({ _sum: { totalExpenses: true }, where: { closedAt: { gte: dayStart, lte: dayEnd } } }),
      ]);

      return {
        month: day.toLocaleDateString("es-EC", { day: "numeric", month: "short", timeZone: "America/Guayaquil" }),
        income:   Number(inc._sum.totalIncome   ?? 0),
        expenses: Number(exp._sum.totalExpenses ?? 0),
      };
    })
  );
}

async function getDailyDataForBranch(branchId: string, start: Date, end: Date) {
  const days: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cur <= endDay) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return Promise.all(
    days.map(async (day) => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
      const dayEnd   = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.cashClosing.aggregate({ _sum: { totalIncome: true },   where: { branchId, closedAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.cashClosing.aggregate({ _sum: { totalExpenses: true }, where: { branchId, closedAt: { gte: dayStart, lte: dayEnd } } }),
      ]);

      return {
        month: day.toLocaleDateString("es-EC", { day: "numeric", month: "short", timeZone: "America/Guayaquil" }),
        income:   Number(inc._sum.totalIncome   ?? 0),
        expenses: Number(exp._sum.totalExpenses ?? 0),
      };
    })
  );
}

async function getMonthlyRangeData(start: Date, end: Date) {
  const months: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  return Promise.all(
    months.map(async (monthStart) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.cashClosing.aggregate({ _sum: { totalIncome: true },   where: { closedAt: { gte: monthStart, lte: monthEnd } } }),
        prisma.cashClosing.aggregate({ _sum: { totalExpenses: true }, where: { closedAt: { gte: monthStart, lte: monthEnd } } }),
      ]);

      const name = monthStart.toLocaleDateString("es-EC", { month: "short", timeZone: "America/Guayaquil" });
      return {
        month: name.charAt(0).toUpperCase() + name.slice(1),
        income:   Number(inc._sum.totalIncome   ?? 0),
        expenses: Number(exp._sum.totalExpenses ?? 0),
      };
    })
  );
}

async function getMonthlyRangeDataForBranch(branchId: string, start: Date, end: Date) {
  const months: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  return Promise.all(
    months.map(async (monthStart) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.cashClosing.aggregate({ _sum: { totalIncome: true },   where: { branchId, closedAt: { gte: monthStart, lte: monthEnd } } }),
        prisma.cashClosing.aggregate({ _sum: { totalExpenses: true }, where: { branchId, closedAt: { gte: monthStart, lte: monthEnd } } }),
      ]);

      const name = monthStart.toLocaleDateString("es-EC", { month: "short", timeZone: "America/Guayaquil" });
      return {
        month: name.charAt(0).toUpperCase() + name.slice(1),
        income:   Number(inc._sum.totalIncome   ?? 0),
        expenses: Number(exp._sum.totalExpenses ?? 0),
      };
    })
  );
}
