"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyDataItem {
  month: string;
  income: number;
  expenses: number;
}

interface PaymentDistribution {
  cash: number;
  transfer: number;
  debitCard: number;
  creditCard: number;
}

export interface BranchStat {
  branchId: string;
  branchName: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  paymentDistribution: PaymentDistribution;
  monthlyData: MonthlyDataItem[];
}

interface BranchStatsSectionProps {
  branchStats: BranchStat[];
}

const PAYMENT_COLORS = ["#003772", "#fdcc10", "#004e9c", "#745b00"];
const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  debitCard: "T. Débito",
  creditCard: "T. Crédito",
};

export function BranchStatsSection({ branchStats }: BranchStatsSectionProps) {
  if (branchStats.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-title-md text-on-surface font-bold">
          Resumen por Sucursal
        </h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Ingresos, egresos, gráfica y formas de pago — mes actual
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {branchStats.map((branch) => (
          <BranchCard key={branch.branchId} branch={branch} />
        ))}
      </div>
    </div>
  );
}

function BranchCard({ branch }: { branch: BranchStat }) {
  const paymentItems = Object.entries(branch.paymentDistribution)
    .map(([key, value], i) => ({
      key,
      label: PAYMENT_LABELS[key] ?? key,
      value,
      color: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
    }))
    .filter((item) => item.value > 0);

  const totalPayments = paymentItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-primary/5 border-b border-outline-variant/20 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-xl">store</span>
        <h3 className="text-title-sm text-on-surface font-bold">
          {branch.branchName}
        </h3>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1">
            <span className="text-label-sm text-outline uppercase tracking-wide">
              Ingresos
            </span>
            <span className="text-title-sm font-black text-on-surface monospaced-numbers">
              {formatCurrency(branch.totalIncome)}
            </span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1">
            <span className="text-label-sm text-outline uppercase tracking-wide">
              Egresos
            </span>
            <span className="text-title-sm font-black text-error monospaced-numbers">
              {formatCurrency(branch.totalExpenses)}
            </span>
          </div>
          <div
            className={`rounded-lg p-3 flex flex-col gap-1 ${
              branch.netBalance >= 0 ? "bg-green-50" : "bg-error-container/30"
            }`}
          >
            <span className="text-label-sm text-outline uppercase tracking-wide">
              Balance
            </span>
            <span
              className={`text-title-sm font-black monospaced-numbers ${
                branch.netBalance >= 0 ? "text-green-700" : "text-error"
              }`}
            >
              {branch.netBalance >= 0 ? "" : "-"}
              {formatCurrency(Math.abs(branch.netBalance))}
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-label-md text-on-surface-variant font-semibold mb-3">
            Ingresos vs Egresos — Últimos 6 meses
          </h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={branch.monthlyData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                vertical={false}
                stroke="#c2c6d3"
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#727782" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#727782" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(194,198,211,0.3)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="income"
                name="Ingresos"
                fill="#003772"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Egresos"
                fill="#fdcc10"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-body-sm text-on-surface-variant">
                Ingresos
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-secondary-container" />
              <span className="text-body-sm text-on-surface-variant">
                Egresos
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h4 className="text-label-md text-on-surface-variant font-semibold mb-3">
            Formas de Pago
          </h4>
          {paymentItems.length === 0 ? (
            <div className="flex items-center gap-2 text-on-surface-variant/50">
              <span className="material-symbols-outlined text-lg">
                payments
              </span>
              <p className="text-body-sm">Sin movimientos este mes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paymentItems.map((item) => {
                const pct =
                  totalPayments > 0 ? (item.value / totalPayments) * 100 : 0;
                return (
                  <div key={item.key}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: item.color }}
                        />
                        <span className="text-body-sm text-on-surface-variant">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-body-sm font-semibold text-on-surface monospaced-numbers">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-body-sm text-outline monospaced-numbers w-12 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
