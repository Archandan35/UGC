import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

/**
 * Reusable chart primitives used by AnalyticsPage and the admin
 * dashboard. All visual tokens (colors, sizes) come from global.css
 * via CSS variables — see `.chart-card` and the `--chart-*` palette.
 */

const PALETTE = ["#2563eb", "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#1e40af"];

export function LineTrend({ data, xKey = "label", yKey = "value", label = "Value" }) {
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={yKey}
            name={label}
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarBreakdown({ data, xKey = "label", yKey = "value", label = "Count" }) {
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={yKey} name={label} fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutShare({ data, nameKey = "label", valueKey = "value" }) {
  const colored = useMemo(
    () => data.map((d, i) => ({ ...d, _fill: PALETTE[i % PALETTE.length] })),
    [data]
  );
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Tooltip />
          <Legend verticalAlign="bottom" height={24} />
          <Pie
            data={colored}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {colored.map((d) => (
              <Cell key={d[nameKey]} fill={d._fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default { LineTrend, BarBreakdown, DonutShare };
