"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SubjectChartProps {
  data: {
    subject_code: string;
    total_marks: number;
    grade: string;
  }[];
}

export function SubjectChart({ data }: SubjectChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-slate-500">No subject data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 25,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="subject_code" 
          stroke="#64748b" 
          fontSize={10} 
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
        />
        <YAxis 
          stroke="#64748b" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
          itemStyle={{ color: '#38bdf8' }}
          cursor={{ fill: '#1e293b', opacity: 0.4 }}
        />
        <Bar dataKey="total_marks" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.total_marks < 40 ? '#f43f5e' : entry.total_marks > 80 ? '#10b981' : '#38bdf8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
