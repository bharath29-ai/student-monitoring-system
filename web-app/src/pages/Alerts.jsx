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
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-foreground">Alerts</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2.5">{unreadCount} new</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 text-xs">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-xs text-destructive">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="distracted">Distracted</TabsTrigger>
          <TabsTrigger value="sleepy">Sleepy</TabsTrigger>
          <TabsTrigger value="low_attention">Low Attention</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Captured Snapshots from Camera */}
      {snapshots.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Classroom Snapshots</span>
              <Badge variant="outline" className="text-[10px]">{snapshots.length}</Badge>
            </div>
            <button onClick={clearSnapshots} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {snapshots.map(snap => (
              <div key={snap.id} className="rounded-xl overflow-hidden border border-border bg-black relative">
                <img src={snap.snapshot} alt="snapshot" className="w-full aspect-video object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-white truncate">{snap.label}</p>
                  <p className="text-[9px] text-white/60">{snap.time}</p>
                </div>
                <div className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                  snap.attention >= 70 ? 'bg-green-600' : snap.attention >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                }`}>
                  {snap.attention}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">No alerts yet</p>
            <p className="text-xs mt-1">Alerts will appear when attention issues are detected</p>
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