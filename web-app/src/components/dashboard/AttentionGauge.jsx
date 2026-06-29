import React from 'react';
import { motion } from 'framer-motion';

export default function AttentionGauge({ percentage = 0 }) {
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (pct) => {
    if (pct >= 80) return { stroke: '#22c55e', text: 'text-green-500', label: 'Excellent' };
    if (pct >= 60) return { stroke: '#3b82f6', text: 'text-blue-500', label: 'Good' };
    if (pct >= 40) return { stroke: '#f59e0b', text: 'text-orange-500', label: 'Needs Attention' };
    return { stroke: '#ef4444', text: 'text-red-500', label: 'Critical' };
  };

  const colorInfo = getColor(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center rounded-2xl bg-card border border-border p-6 shadow-sm"
    >
      <p className="text-sm font-medium text-muted-foreground mb-4">Classroom Attention</p>
      <div className="relative w-44 h-44">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="10"
          />
          <motion.circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold ${colorInfo.text}`}>{percentage}%</span>
          <span className="text-xs text-muted-foreground mt-1">{colorInfo.label}</span>
        </div>
      </div>
    </motion.div>
  );
}