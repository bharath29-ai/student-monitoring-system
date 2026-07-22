import React, { useMemo, useState, useEffect } from 'react';
import { FileText, TrendingUp, Clock, Calendar, RefreshCcw } from 'lucide-react';
import AttentionChart from '@/components/reports/AttentionChart';
import StatusPieChart from '@/components/reports/StatusPieChart';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const fetchReports = useMemo(() => {
    if (!user?.id) return () => {};

    let q;
    if (user.role === 'teacher') {
      q = query(collection(db, 'reports'), where('teacherId', '==', user.id));
    } else if (user.role === 'student') {
      q = query(collection(db, 'reports'), where('studentId', '==', user.id));
    } else {
      q = query(collection(db, 'reports'), limit(100));
    }

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually to avoid index requirement
      data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setReports(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Reports listener error:", error);
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    return fetchReports;
  }, [fetchReports]);

  const stats = useMemo(() => {
    const res = { attentive: 0, distracted: 0, sleepy: 0 };
    reports.forEach(r => {
      const status = r.status || 'attentive';
      if (res[status] !== undefined) res[status]++;
    });
    return res;
  }, [reports]);

  if (!user) return null;

  if (!user) return null;

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Mobile-Friendly Page Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight italic">
            {user.role === 'student' ? 'My Analytics' : 'Class Analytics'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Session Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-11 px-4 flex items-center justify-center gap-1.5 rounded-full bg-secondary text-xs font-black uppercase text-foreground active:scale-95 transition-all">
            <FileText className="w-4 h-4 text-primary" /> Export PDF
          </button>
          <button
            onClick={() => setIsLoading(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary text-foreground active:scale-90 transition-all"
            aria-label="Refresh reports"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-bold">Syncing report cards...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Material You Tonal Cards for Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[24px] bg-[#E6F4EA] dark:bg-[#0F5224]/30 border border-[#CEEAD6]/30 p-4 flex flex-col justify-between h-24 shadow-sm">
              <span className="text-[9px] font-black text-[#137333] dark:text-[#E6F4EA] uppercase tracking-wider leading-none">Attentive</span>
              <span className="text-2xl font-black text-[#137333] dark:text-[#E6F4EA] mt-auto">{stats.attentive}</span>
            </div>
            <div className="rounded-[24px] bg-[#FEF7E0] dark:bg-[#663C00]/30 border border-[#FEEFC3]/30 p-4 flex flex-col justify-between h-24 shadow-sm">
              <span className="text-[9px] font-black text-[#B06000] dark:text-[#FEF7E0] uppercase tracking-wider leading-none">Distracted</span>
              <span className="text-2xl font-black text-[#B06000] dark:text-[#FEF7E0] mt-auto">{stats.distracted}</span>
            </div>
            <div className="rounded-[24px] bg-[#F3E8FD] dark:bg-[#4E1E8C]/30 border border-[#E8D0FA]/30 p-4 flex flex-col justify-between h-24 shadow-sm">
              <span className="text-[9px] font-black text-[#8430D9] dark:text-[#F3E8FD] uppercase tracking-wider leading-none">Sleepy</span>
              <span className="text-2xl font-black text-[#8430D9] dark:text-[#F3E8FD] mt-auto">{stats.sleepy}</span>
            </div>
          </div>

          {/* Visualization Section */}
          <div className="rounded-[28px] overflow-hidden bg-card border border-border/50 p-4 shadow-sm">
            <StatusPieChart
              attentive={stats.attentive}
              distracted={stats.distracted}
              sleepy={stats.sleepy}
            />
          </div>

          {/* Recent Monitoring Logs - Android Native List styling */}
          <div className="rounded-[28px] bg-card border border-border/50 p-5 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">Recent Activity Logs</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
              {reports.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/15 rounded-[20px] border border-dashed border-border/60">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold leading-normal">No recent logs found.</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Start a face monitoring session to sync data.</p>
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="p-4 bg-secondary/30 active:bg-secondary/60 rounded-2xl border border-border/40 flex items-center justify-between transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                        report.status === 'attentive' ? 'bg-green-500 shadow-md shadow-green-500/20' :
                        report.status === 'distracted' ? 'bg-orange-500 shadow-md shadow-orange-500/20' : 'bg-purple-500 shadow-md shadow-purple-500/20'
                      }`} />
                      <div>
                        <p className="text-xs font-black capitalize text-foreground">{report.status || 'Unknown'}</p>
                        <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleTimeString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-[10px] font-black text-foreground truncate max-w-[120px]">{report.className || 'General'}</p>
                      <p className="text-[9px] text-muted-foreground font-semibold truncate max-w-[120px]">{user.role === 'teacher' ? report.studentName : report.teacherName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
