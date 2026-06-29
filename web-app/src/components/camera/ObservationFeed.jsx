import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ObservationFeed({ observations }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Observations</h3>
      </div>
      <div className="space-y-2">
        {observations.map((obs, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
              obs.attention >= 70 ? 'bg-green-500' :
              obs.attention >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{obs.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{obs.time} · {obs.attention}% attention</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}