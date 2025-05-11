import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  usersByMonth: Record<string, number>;
  loading?: boolean;
  height?: number;
}

export default function UsersGrowthChart({ usersByMonth, loading, height = 250 }: Props) {
  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  const data = Object.entries(usersByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      // Ordenar por mês e ano
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      return yearA === yearB 
        ? monthA.localeCompare(monthB) 
        : yearA.localeCompare(yearB);
    })
    .slice(-6); // Mostrar apenas os últimos 6 meses

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
        <Tooltip contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }} formatter={(value) => [`${value} usuários`, 'Novos usuários']} />
        <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
