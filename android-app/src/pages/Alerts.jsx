import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AlertItem from '@/components/alerts/AlertItem';
import useClassroomData from '@/hooks/useClassroomData';
import { useSnapshots } from '@/lib/SnapshotContext';

const studentNames = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 
  'Kavita', 'Arjun', 'Meera', 'Suresh', 'Divya', 'Kiran', 'Neha'
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const { data } = useClassroomData(2000);
  const prevDataRef = useRef(null);
  const { snapshots, clearSnapshots } = useSnapshots();

  // Generate alerts based on classroom data changes
  useEffect(() => {
    if (!data) return;

    const prev = prevDataRef.current;
    const newAlerts = [];

    if (data.distracted > 3) {
      const name = studentNames[Math.floor(Math.random() * studentNames.length)];
      newAlerts.push({
        id: Date.now() + Math.random(),
        message: `⚠ Alert: ${name} is distracted`,
        type: 'distracted',
        severity: data.distracted > 5 ? 'high' : 'medium',
        student_name: name,
        is_read: false,
        created_date: new Date().toISOString(),
      });
    }

    if (data.sleepy > 1 && (!prev || data.sleepy > prev.sleepy)) {
      const name = studentNames[Math.floor(Math.random() * studentNames.length)];
      newAlerts.push({
        id: Date.now() + Math.random() + 1,
        message: `😴 ${name} appears to be sleepy`,
        type: 'sleepy',
        severity: 'medium',
        student_name: name,
        is_read: false,
        created_date: new Date().toISOString(),
      });
    }

    if (data.attention_percentage < 60) {
      newAlerts.push({
        id: Date.now() + Math.random() + 2,
        message: `🔴 Classroom attention dropped to ${data.attention_percentage}%`,
        type: 'low_attention',
        severity: data.attention_percentage < 40 ? 'critical' : 'high',
        is_read: false,
        created_date: new Date().toISOString(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
    }

    prevDataRef.current = data;
  }, [data]);

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight italic">Attention Alerts</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2.5 py-0.5 rounded-full font-black animate-pulse text-[9px]">
                {unreadCount} New
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              onClick={markAllRead} 
              className="h-10 rounded-full font-bold text-xs uppercase tracking-wide gap-1.5 px-4 border-border/50 hover:bg-secondary"
            >
              <CheckCheck className="w-4 h-4 text-primary" /> Read All
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAll} 
              className="h-10 rounded-full font-bold text-xs uppercase tracking-wide gap-1.5 px-4 border-destructive/20 text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Segmented Chips for Filter */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { value: 'all', label: 'All Alerts' },
            { value: 'distracted', label: 'Looking Away' },
            { value: 'sleepy', label: 'Drowsiness' },
            { value: 'low_attention', label: 'Drop in Focus' }
          ].map(opt => {
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`h-10 px-5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border ${
                  isActive 
                    ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10 font-extrabold' 
                    : 'bg-card border-border/60 text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Captured Snapshots from Camera (Material You Elevated Card) */}
      {snapshots.length > 0 && (
        <div className="rounded-[28px] bg-card border border-border/50 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-black text-xs uppercase tracking-wider text-muted-foreground">Classroom Live Captures</span>
              <Badge variant="outline" className="text-[10px] font-black rounded-full bg-secondary">{snapshots.length}</Badge>
            </div>
            <button onClick={clearSnapshots} className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {snapshots.map(snap => (
              <div key={snap.id} className="rounded-2xl overflow-hidden border border-border bg-black relative shadow-sm group">
                <img src={snap.snapshot} alt="snapshot" className="w-full aspect-video object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 px-3 py-2">
                  <p className="text-[10px] font-bold text-white truncate">{snap.label}</p>
                  <p className="text-[9px] text-white/60 font-semibold">{snap.time}</p>
                </div>
                <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-md ${
                  snap.attention >= 70 ? 'bg-green-600' : snap.attention >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                }`}>
                  {snap.attention}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border/40 rounded-[28px] p-6 bg-secondary/10">
            <Bell className="w-12 h-12 mb-3 opacity-30 text-primary" />
            <p className="text-sm font-bold">All clear!</p>
            <p className="text-xs text-center opacity-85 mt-1">Real-time alerts will trigger here when students display low engagement.</p>
          </div>
        ) : (
          filteredAlerts.map((alert, i) => (
            <AlertItem key={alert.id} alert={alert} index={i} />
          ))
        )}
      </div>
    </div>
  );
}