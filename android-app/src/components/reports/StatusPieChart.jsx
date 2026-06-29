import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#8b5cf6', '#94a3b8'];

export default function StatusPieChart({ attentive = 0, distracted = 0, sleepy = 0 }) {
  const data = [
    { name: 'Attentive', value: attentive },
    { name: 'Distracted', value: distracted },
    { name: 'Sleepy', value: sleepy },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm flex items-center justify-center h-80">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-1">Student Status Distribution</h3>
      <p className="text-xs text-muted-foreground mb-4">Current classroom breakdown</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Legend 
              iconType="circle" 
              iconSize={8} 
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}