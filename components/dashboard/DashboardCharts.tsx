"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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

interface DashboardChartsProps {
  monthlyData: MonthlyDataItem[];
  paymentDistribution: PaymentDistribution;
}

const COLORS = ["#003772", "#fdcc10", "#004e9c", "#745b00"];

const PIE_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  debitCard: "T. Débito",
  creditCard: "T. Crédito",
};

export function DashboardCharts({
  monthlyData,
  paymentDistribution,
}: DashboardChartsProps) {
  const pieData = Object.entries(paymentDistribution)
    .map(([key, value]) => ({
      name: PIE_LABELS[key] ?? key,
      value,
    }))
    .filter((d) => d.value > 0);

  const total = Object.values(paymentDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Bar Chart — Ingresos vs Egresos */}
      <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-title-md text-on-surface font-bold">
            Ingresos vs Egresos
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Últimos 6 meses
          </p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={monthlyData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid vertical={false} stroke="#c2c6d3" strokeOpacity={0.3} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#727782" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#727782" }}
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
            <Bar dataKey="income" name="Ingresos" fill="#003772" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Egresos" fill="#fdcc10" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-body-sm text-on-surface-variant">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-secondary-container" />
            <span className="text-body-sm text-on-surface-variant">Egresos</span>
          </div>
        </div>
      </div>

      {/* Pie Chart — Distribución de pagos */}
      <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-title-md text-on-surface font-bold">
            Formas de Pago
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Distribución del mes
          </p>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl opacity-30">
              pie_chart
            </span>
            <p className="text-body-sm mt-2">Sin datos este mes</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-body-sm text-on-surface-variant">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-body-sm font-semibold text-on-surface monospaced-numbers">
                    {total > 0
                      ? `${((item.value / total) * 100).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
