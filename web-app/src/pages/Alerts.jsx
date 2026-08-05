import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCheck, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch real alerts from Firestore for this teacher
    const q = query(
      collection(db, 'alerts'),
      where('teacherId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Alerts listener error:", error);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user?.id]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter(a => a.status?.toLowerCase() === filter.toLowerCase());
  }, [alerts, filter]);

  const clearAll = async () => {
    if (!user?.id || alerts.length === 0) return;
    try {
      const q = query(collection(db, 'alerts'), where('teacherId', '==', user.id));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error("Clear alerts error:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Alerts <ShieldAlert className="w-6 h-6 text-destructive" />
          </h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">
            Critical Behavioral Notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="h-10 rounded-full font-bold px-5 text-destructive border-destructive/20 hover:bg-destructive/10 active:scale-95 transition-all"
            disabled={alerts.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="bg-secondary/50 p-1 h-12 rounded-2xl border border-border/40">
          <TabsTrigger value="all" className="rounded-xl px-6 font-bold text-xs uppercase tracking-wider">All ({alerts.length})</TabsTrigger>
          <TabsTrigger value="sleepy" className="rounded-xl px-6 font-bold text-xs uppercase tracking-wider">Sleepy</TabsTrigger>
          <TabsTrigger value="distracted" className="rounded-xl px-6 font-bold text-xs uppercase tracking-wider">Distracted</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-secondary/10 rounded-[32px] border-2 border-dashed border-border/60"
              >
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
                  <Bell className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest opacity-60">No Active Alerts</p>
                <p className="text-[10px] mt-2 text-center max-w-[200px] leading-relaxed font-bold opacity-50 uppercase">
                  Alerts will trigger when student attention drops below 50%
                </p>
              </motion.div>
            ) : (
              filteredAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all shadow-sm ${
                    alert.status?.toLowerCase() === 'sleepy'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-orange-500/5 border-orange-500/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                      alert.status?.toLowerCase() === 'sleepy' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      <Bell className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">
                        {alert.studentName} is <span className="uppercase">{alert.status}</span>
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3" />
                        {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="rounded-full font-black text-[9px] uppercase bg-background px-3">
                      Score: {alert.score}%
                    </Badge>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
