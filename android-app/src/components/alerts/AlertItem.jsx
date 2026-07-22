import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Moon, Info, Clock, AlertOctagon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const typeConfig = {
  distracted: { icon: Eye, color: 'text-orange-600', bg: 'bg-orange-500/10', badge: 'bg-orange-500/15 text-orange-700 border-orange-500/20' },
  sleepy: { icon: Moon, color: 'text-purple-600', bg: 'bg-purple-500/10', badge: 'bg-purple-500/15 text-purple-700 border-purple-500/20' },
  low_attention: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10', badge: 'bg-red-500/15 text-red-700 border-red-500/20' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-500/10', badge: 'bg-blue-500/15 text-blue-700 border-blue-500/20' },
};

const severityStrip = {
  low: 'border-l-[6px] border-l-green-500',
  medium: 'border-l-[6px] border-l-yellow-500',
  high: 'border-l-[6px] border-l-orange-500',
  critical: 'border-l-[6px] border-l-red-500 animate-pulse',
};

const severityBadge = {
  low: 'bg-green-500/10 text-green-700 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export default function AlertItem({ alert, index = 0 }) {
  const config = typeConfig[alert.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`flex items-start gap-4 p-4 rounded-[24px] bg-card border border-border/40 shadow-sm transition-all active:scale-[0.99] ${
        severityStrip[alert.severity] || severityStrip.medium
      }`}
    >
      <div className={`w-11 h-11 rounded-2xl ${config.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-bold leading-normal ${alert.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {alert.message}
          </p>
          {!alert.is_read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider ${config.badge}`}>
            {alert.type.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider ${
            severityBadge[alert.severity] || severityBadge.medium
          }`}>
            {alert.severity}
          </Badge>

          {alert.created_date && (
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {format(new Date(alert.created_date), 'HH:mm')}
            </span>
          )}
        </div>

        {/* Snapshot preview if present */}
        {alert.snapshot && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-border/50 bg-black relative shadow-inner">
            <img
              src={alert.snapshot}
              alt="Alert snapshot"
              className="w-full max-h-40 object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md rounded-lg px-2 py-1 text-[9px] font-bold text-white uppercase tracking-wider">
              Trigger Snapshot
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}