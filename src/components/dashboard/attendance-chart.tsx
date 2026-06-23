"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AttendanceChartProps {
  data: {
    semester?: number;
    semester_number?: number;
    attendance_percentage?: number;
    percentage?: number;
  }[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-slate-500">No attendance data available</div>;
  }

  const formattedData = data.map(d => ({
    name: `Sem ${d.semester || d.semester_number}`,
    percentage: d.attendance_percentage || d.percentage
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
          itemStyle={{ color: '#f59e0b' }}
        />
        <Area 
          type="monotone" 
          dataKey="percentage" 
          stroke="#f59e0b" 
          fillOpacity={1} 
          fill="url(#colorPercentage)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
