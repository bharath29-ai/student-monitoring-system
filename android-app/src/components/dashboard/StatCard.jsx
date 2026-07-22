import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, color, subtitle, delay = 0 }) {
  const bgColors = {
    blue: 'bg-[#E8F0FE] text-[#041E49] dark:bg-[#004A77] dark:text-[#E8F0FE] border-[#D3E3FD]/30',
    green: 'bg-[#E6F4EA] text-[#137333] dark:bg-[#0F5224] dark:text-[#E6F4EA] border-[#CEEAD6]/30',
    orange: 'bg-[#FEF7E0] text-[#B06000] dark:bg-[#663C00] dark:text-[#FEF7E0] border-[#FEEFC3]/30',
    red: 'bg-[#FCE8E6] text-[#C5221F] dark:bg-[#7A1513] dark:text-[#FCE8E6] border-[#FAD2CF]/30',
    purple: 'bg-[#F3E8FD] text-[#8430D9] dark:bg-[#4E1E8C] dark:text-[#F3E8FD] border-[#E8D0FA]/30',
  };

  const iconBg = {
    blue: 'bg-primary text-primary-foreground shadow-primary/10',
    green: 'bg-green-600 text-white shadow-green-500/10',
    orange: 'bg-amber-500 text-white shadow-amber-500/10',
    red: 'bg-red-600 text-white shadow-red-500/10',
    purple: 'bg-purple-600 text-white shadow-purple-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
      className={`rounded-[28px] border p-5 flex flex-col justify-between h-36 shadow-sm transition-all active:scale-[0.98] ${
        bgColors[color] || bgColors.blue
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider opacity-80">{title}</span>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${iconBg[color] || iconBg.blue}`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      <div className="space-y-1 mt-auto">
        <div className="text-3xl font-black tracking-tight leading-none">{value}</div>
        {subtitle && (
          <p className="text-[10px] opacity-75 font-semibold tracking-wide uppercase">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}