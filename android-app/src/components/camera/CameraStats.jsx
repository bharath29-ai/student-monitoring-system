import React from 'react';
import { Eye, AlertTriangle, Moon, Users } from 'lucide-react';

const stats = [
  { key: 'total_students', label: 'Total Detected', icon: Users, color: 'blue' },
  { key: 'attentive', label: 'Attentive', icon: Eye, color: 'green' },
  { key: 'distracted', label: 'Distracted', icon: AlertTriangle, color: 'orange' },
  { key: 'sleepy', label: 'Sleepy', icon: Moon, color: 'purple' },
];

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-600',
  green: 'bg-green-500/10 text-green-600',
  orange: 'bg-orange-500/10 text-orange-600',
  purple: 'bg-purple-500/10 text-purple-600',
};

export default function CameraStats({ data }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-extrabold text-foreground">{data?.[key] ?? 0}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}