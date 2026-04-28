"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

function formatTick(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatTick} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(value: number) =>
            [`$${value.toLocaleString("en-CA", { minimumFractionDigits: 2 })}`, "Revenue"]
          }
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        />
        <Bar dataKey="revenue" fill="#444ce7" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
