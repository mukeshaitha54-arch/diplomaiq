"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SGPAChartProps {
  data: {
    semester_number: number;
    sgpa: number;
  }[];
}

export function SGPAChart({ data }: SGPAChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-slate-500">No semester data available</div>;
  }

  const formattedData = data.map(d => ({
    name: `Sem ${d.semester_number}`,
    sgpa: d.sgpa
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="#64748b" 
          fontSize={12} 
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={['auto', 10]}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
          itemStyle={{ color: '#818cf8' }}
        />
        <Line 
          type="monotone" 
          dataKey="sgpa" 
          stroke="#818cf8" 
          strokeWidth={2}
          activeDot={{ r: 8 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
