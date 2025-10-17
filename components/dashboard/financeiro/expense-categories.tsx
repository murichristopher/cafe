'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  {
    name: "Insumos",
    value: 35,
    color: "#22c55e"
  },
  {
    name: "Folha de Pagamento",
    value: 25,
    color: "#3b82f6"
  },
  {
    name: "Fornecedores",
    value: 20,
    color: "#f59e0b"
  },
  {
    name: "Transporte",
    value: 10,
    color: "#ef4444"
  },
  {
    name: "Outros",
    value: 10,
    color: "#8b5cf6"
  }
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ExpenseCategories() {
  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.name}</span>
            <span className="text-sm font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 