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
      // Allow searching by either studentId or uid for compatibility
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
      const status = (r.status || 'attentive').toLowerCase();
      if (res[status] !== undefined) res[status]++;
    });
    return res;
  }, [reports]);

  if (!user) return null;

  if (isMobile) {
    return (
      <MobileReports
        user={user}
        reports={reports}
        stats={stats}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    );
  }

  return (
    <DesktopReports
      user={user}
      reports={reports}
      stats={stats}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />
  );
}

// ── MOBILE REPORTS LAYOUT (Android / Mobile Optimized) ──
function MobileReports({ user, reports, stats, isLoading, setIsLoading }) {
  return (
    <div className="space-y-5 animate-slide-up pb-10">
      {/* Mobile-Friendly Page Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            {user.role === 'student' ? 'My Analytics' : 'Class Analytics'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Session Reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-secondary/85 text-[11px] font-black uppercase active:scale-95 transition-all">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={() => setIsLoading(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary/80 active:scale-90 transition-transform"
          >
            <RefreshCcw className={`w-4 h-4 text-foreground ${isLoading ? 'animate-spin' : ''}`} />
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
          {/* Vertical Stacked Mobile Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-card border border-border p-3 flex flex-col justify-between h-20 shadow-sm border-b-4 border-b-green-500">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Attentive</span>
              <span className="text-xl font-black text-green-500">{stats.attentive}</span>
            </div>
            <div className="rounded-2xl bg-card border border-border p-3 flex flex-col justify-between h-20 shadow-sm border-b-4 border-b-orange-500">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Distracted</span>
              <span className="text-xl font-black text-orange-500">{stats.distracted}</span>
            </div>
            <div className="rounded-2xl bg-card border border-border p-3 flex flex-col justify-between h-20 shadow-sm border-b-4 border-b-purple-500">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Sleepy</span>
              <span className="text-xl font-black text-purple-500">{stats.sleepy}</span>
            </div>
          </div>

          {/* Touch-Optimized Charts Wrapper */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <StatusPieChart
                attentive={stats.attentive}
                distracted={stats.distracted}
                sleepy={stats.sleepy}
              />
            </div>

            {/* Recent Logs List - Touch Optimized */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm flex flex-col h-[380px]">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Recent Monitoring Logs</h3>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {reports.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/10 rounded-xl border border-dashed border-border/60">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">No recent logs.<br/>Launch a session to start syncing.</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="p-3.5 bg-secondary/35 active:bg-secondary/60 rounded-xl border border-border/50 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          report.status?.toLowerCase() === 'attentive' ? 'bg-green-500' :
                          report.status?.toLowerCase() === 'distracted' ? 'bg-orange-500' : 'bg-purple-500'
                        }`} />
                        <div>
                          <p className="text-xs font-black capitalize text-foreground">{report.status || 'Unknown'}</p>
                          <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleTimeString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-[10px] font-black text-foreground truncate max-w-[120px]">{report.className || 'General'}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold truncate max-w-[120px]">
                          {user.role === 'teacher' ? report.studentName : (report.teacherName || 'Teacher')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DESKTOP REPORTS LAYOUT (Original Untouched) ──
function DesktopReports({ user, reports, stats, isLoading, setIsLoading }) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {user.role === 'student' ? 'My Attention Reports' : 'Class Analytics'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Insights from monitoring sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsLoading(true)} className="gap-2">
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attentive Reports</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.attentive}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distracted Instances</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.distracted}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sleepy Alerts</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.sleepy}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatusPieChart
              attentive={stats.attentive}
              distracted={stats.distracted}
              sleepy={stats.sleepy}
            />

            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm overflow-hidden flex flex-col h-[400px]">
              <h3 className="text-sm font-semibold mb-4">Recent Logs</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {reports.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/20 rounded-xl border border-dashed">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No reports found.<br/>Start monitoring to see data here.</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center justify-between hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          report.status?.toLowerCase() === 'attentive' ? 'bg-green-500' :
                          report.status?.toLowerCase() === 'distracted' ? 'bg-orange-500' : 'bg-purple-500'
                        }`} />
                        <div>
                          <p className="text-sm font-bold capitalize">{report.status || 'Unknown'}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium truncate max-w-[100px]">{report.className || 'General'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {user.role === 'teacher' ? report.studentName : (report.teacherName || 'Teacher')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
