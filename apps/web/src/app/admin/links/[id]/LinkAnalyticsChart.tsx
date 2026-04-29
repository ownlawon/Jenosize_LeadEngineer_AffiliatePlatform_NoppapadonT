"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: Array<{ date: string; clicks: number; impressions: number }>;
}

export default function LinkAnalyticsChart({ data }: Props) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            fontSize={11}
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fill: "#64748b" }}
          />
          <YAxis
            allowDecimals={false}
            fontSize={11}
            tick={{ fill: "#64748b" }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="impressions"
            name="Impressions"
            fill="#cbd5e1"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="clicks"
            name="Clicks"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
