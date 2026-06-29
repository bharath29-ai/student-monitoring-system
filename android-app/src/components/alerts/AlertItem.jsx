import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Moon, Info, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const typeConfig = {
  distracted: { icon: Eye, color: 'text-orange-500', bg: 'bg-orange-500/10', badge: 'bg-orange-500/15 text-orange-600 border-orange-500/20' },
  sleepy: { icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10', badge: 'bg-purple-500/15 text-purple-600 border-purple-500/20' },
  low_attention: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', badge: 'bg-red-500/15 text-red-600 border-red-500/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', badge: 'bg-blue-500/15 text-blue-600 border-blue-500/20' },
};

const severityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function AlertItem({ alert, index = 0 }) {
  const config = typeConfig[alert.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex items-start gap-4 p-4 rounded-xl border border-border ${alert.is_read ? 'bg-card' : 'bg-card shadow-sm'} transition-all hover:shadow-md`}
    >
      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${alert.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {alert.message}
          </p>
          {!alert.is_read && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={`text-[10px] ${config.badge} border`}>
            {alert.type.replace('_', ' ')}
          </Badge>
          <div className={`w-1.5 h-1.5 rounded-full ${severityColors[alert.severity] || severityColors.medium}`} />
          <span className="text-[10px] text-muted-foreground capitalize">{alert.severity}</span>
          {alert.created_date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(alert.created_date), 'HH:mm')}
            </span>
          )}
        </div>
        {/* Snapshot thumbnail if captured */}
        {alert.snapshot && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border relative">
            <img
              src={alert.snapshot}
              alt="Classroom snapshot"
              className="w-full max-h-40 object-cover"
            />
            <div className="absolute bottom-1.5 left-1.5 bg-black/70 rounded px-1.5 py-0.5 text-[9px] text-white">
              Captured at alert time
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}