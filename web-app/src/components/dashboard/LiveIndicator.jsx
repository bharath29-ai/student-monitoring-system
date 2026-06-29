import React from 'react';
import { Radio } from 'lucide-react';

export default function LiveIndicator({ lastUpdate }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border border-border">
      <div className="relative">
        <Radio className="w-4 h-4 text-green-500" />
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500/30 animate-pulse-ring" />
      </div>
      <div>
        <p className="text-xs font-semibold text-green-600">Live Monitoring</p>
        <p className="text-[10px] text-muted-foreground">
          {lastUpdate ? `Updated ${lastUpdate}` : 'Connecting...'}
        </p>
      </div>
    </div>
  );
}