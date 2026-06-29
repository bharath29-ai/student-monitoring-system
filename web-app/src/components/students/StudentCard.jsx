import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const statusConfig = {
  attentive: { color: 'bg-green-500/15 text-green-600 border-green-500/20', dot: 'bg-green-500' },
  distracted: { color: 'bg-orange-500/15 text-orange-600 border-orange-500/20', dot: 'bg-orange-500' },
  sleepy: { color: 'bg-purple-500/15 text-purple-600 border-purple-500/20', dot: 'bg-purple-500' },
  absent: { color: 'bg-gray-500/15 text-gray-600 border-gray-500/20', dot: 'bg-gray-400' },
};

export default function StudentCard({ student, index = 0 }) {
  const config = statusConfig[student.status] || statusConfig.attentive;
  const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  const avatarColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  const avatarColor = avatarColors[index % avatarColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${student.avatar_url ? '' : avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden`}>
          {student.avatar_url
            ? <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
            : initials
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{student.name}</h3>
            <Badge variant="outline" className={`text-[10px] ${config.color} border shrink-0`}>
              <div className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1`} />
              {student.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Roll: {student.roll_number} {student.class_name && `• ${student.class_name}`}
          </p>
          {student.attention_score != null && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Attention Score</span>
                <span className="font-semibold">{student.attention_score}%</span>
              </div>
              <Progress value={student.attention_score} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}