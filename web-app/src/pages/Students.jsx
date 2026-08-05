import React, { useState, useMemo } from 'react';
import { Search, Users, AlertCircle, RefreshCw, UserCheck, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StudentCard from '@/components/students/StudentCard';
import useClassroomData from '@/hooks/useClassroomData';
import { useAuth } from '@/lib/AuthContext';

/**
 * Students Page - Hybrid Roster Monitor
 * Shows assigned students AND auto-discovers active external monitors.
 */
export default function Students() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, studentStatuses, assignedStudents, isRefreshing, fetchData } = useClassroomData(user?.id);

  // HYBRID LIST: Syncs both official roster and live reporters
  const finalStudentsList = useMemo(() => {
    const combined = {};

    // 1. Start with official roster (defaulting to absent)
    if (assignedStudents) {
      assignedStudents.forEach(s => {
        const sId = s.id || s.uid;
        if (sId) {
          combined[sId] = {
            ...s,
            status: 'absent',
            attention_score: null
          };
        }
      });
    }

    // 2. Overlay with Live Monitoring Data
    if (studentStatuses) {
      Object.keys(studentStatuses).forEach(sId => {
        const live = studentStatuses[sId];
        if (combined[sId]) {
          // Official student is online - update status
          combined[sId].status = live.status?.toLowerCase() || 'attentive';
          combined[sId].attention_score = live.score;
          combined[sId].last_sync = live.timestamp;
        } else {
          // Unofficial student is monitoring (Auto-Discovery)
          combined[sId] = {
            id: sId,
            name: live.name || 'External Student',
            email: live.email || 'No email',
            status: live.status?.toLowerCase() || 'attentive',
            attention_score: live.score,
            last_sync: live.timestamp,
            isExternal: true
          };
        }
      });
    }

    return Object.values(combined);
  }, [assignedStudents, studentStatuses]);

  // Apply filters to the combined hybrid list
  const filtered = useMemo(() => {
    return finalStudentsList.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (s.email || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [finalStudentsList, search, statusFilter]);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2 text-primary">
             Class Monitor
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <span className={`w-2 h-2 rounded-full ${data?.active_now > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
             <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
               {assignedStudents.length} Assigned · {data?.active_now || 0} Monitoring Now
             </p>
          </div>
        </div>

        <button
          onClick={() => fetchData()}
          className="h-10 px-4 flex items-center gap-2 bg-secondary/50 hover:bg-secondary rounded-2xl transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest text-foreground border border-border/40 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Force Sync
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search roster..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 h-12 bg-card border-border/60 rounded-2xl focus:ring-primary/20 transition-all text-sm font-bold shadow-inner"
          />
        </div>
        <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="bg-secondary/50 p-1 h-12 rounded-2xl border border-border/40">
            <TabsTrigger value="all" className="rounded-xl px-5 font-bold text-xs uppercase tracking-wider">All ({finalStudentsList.length})</TabsTrigger>
            <TabsTrigger value="attentive" className="rounded-xl px-5 font-bold text-xs uppercase tracking-wider text-green-600">Active</TabsTrigger>
            <TabsTrigger value="absent" className="rounded-xl px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Absent</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-secondary/5 rounded-[40px] border-2 border-dashed border-border/40 shadow-inner">
          <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-6 shadow-sm border border-border/40">
            {search ? <AlertCircle className="w-10 h-10 opacity-20" /> : <Users className="w-10 h-10 opacity-20" />}
          </div>
          <p className="text-sm font-black uppercase tracking-[0.2em] opacity-60 text-center px-4">
             {search ? 'Match Not Found' : 'No Students Detected'}
          </p>
          <p className="text-[10px] mt-3 text-center max-w-[280px] font-bold leading-relaxed opacity-50 uppercase">
             Waiting for students to start their camera monitor or enroll in your feed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((student, i) => (
            <div key={student.id || student.uid || i} className="relative group">
              {student.isExternal && (
                <div className="absolute -top-2 -right-1 z-10 animate-bounce">
                   <Badge className="bg-amber-500 text-[8px] px-1.5 py-0.5 rounded-full border-2 border-background font-black uppercase tracking-tighter shadow-xl">
                      Live discovery
                   </Badge>
                </div>
              )}
              <StudentCard student={student} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
