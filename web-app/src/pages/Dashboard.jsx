import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, Moon, RefreshCw, Camera, CameraOff, Eye, GraduationCap, Shield, Activity, TrendingUp } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import AttentionGauge from '@/components/dashboard/AttentionGauge';
import AttentionChart from '@/components/reports/AttentionChart';
import useClassroomData from '@/hooks/useClassroomData';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const PTR_THRESHOLD = 72;

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentDashboard />;
  } else if (user?.role === 'admin') {
    return <AdminDashboardSummary />;
  }

  return <TeacherDashboard />;
}

function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    // Fetch all classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch student's enrolled classes
    const q = query(collection(db, 'classes'), where('students', 'array-contains', user.id));
    const unsubEnrolled = onSnapshot(q, (snapshot) => {
      setEnrolledClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClasses();
      unsubEnrolled();
    };
  }, [user?.id]);

  const handleEnroll = async (classId, teacherId) => {
    try {
      // 1. Add student to the class array
      await updateDoc(doc(db, 'classes', classId), {
        students: arrayUnion(user.id)
      });

      // 2. Link student to this teacher in their profile
      // This ensures they show up in the teacher's main student list
      await updateDoc(doc(db, 'users', user.id), {
        teacherId: teacherId
      });

      toast({ title: "Enrolled Successfully", description: "You are now part of the classroom feed." });
    } catch (error) {
      toast({ title: "Enrollment Failed", description: "Please check your network connection.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Hello Greeting Header - Matching Native Android */}
      <div className="bg-secondary/40 p-6 rounded-[28px] border border-border/50 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center shadow-lg">
          <GraduationCap className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Welcome, {user?.displayName || user?.name || 'Student'}!</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5">My Learning Dashboard</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Enrolled Classes Card */}
        <Card className="rounded-[28px] border-border/50 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">My Enrolled Classes</CardTitle>
            <CardDescription className="text-xs font-medium">Classes actively running monitoring</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-4 sm:px-6">
            {enrolledClasses.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border/55 rounded-2xl p-4 bg-secondary/10">
                <p className="text-xs font-bold leading-normal italic">No active enrollments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledClasses.map(cls => (
                  <div key={cls.id} className="p-5 bg-secondary/35 rounded-2xl border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{cls.name}</p>
                        <p className="text-[11px] text-muted-foreground font-semibold">Teacher: {cls.teacherName}</p>
                      </div>
                    </div>
                    <Link to="/camera" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto h-11 rounded-full font-black text-[11px] uppercase tracking-wider gap-2 shadow-md shadow-primary/15 active:scale-95 transition-all">
                        <Camera className="w-4 h-4" /> Start Monitoring
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Classes Card */}
        <Card className="rounded-[28px] border-border/50 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Discovery</CardTitle>
            <CardDescription className="text-xs font-medium">Available classroom feeds near you</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-4 sm:px-6">
            <div className="space-y-3">
              {classes.filter(c => !enrolledClasses.some(ec => ec.id === c.id)).map(cls => (
                <div key={cls.id} className="p-5 border border-border/60 rounded-2xl flex items-center justify-between gap-3 bg-background/50">
                  <div>
                    <p className="font-bold text-sm text-foreground">{cls.name}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-tight">Lead: {cls.teacherName}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEnroll(cls.id, cls.teacherId)} className="h-10 rounded-full font-bold px-5 text-xs border-primary/25 hover:border-primary/50 text-primary active:scale-95 transition-all bg-background">
                    Enroll
                  </Button>
                </div>
              ))}
              {classes.filter(c => !enrolledClasses.some(ec => ec.id === c.id)).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center font-medium">All classrooms joined.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboardSummary() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, users: 0, classes: 0 });

  useEffect(() => {
    // Live Users Count
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    // Live Pending Count
    const qPending = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubPending = onSnapshot(qPending, (snap) => {
      setStats(prev => ({ ...prev, pending: snap.size }));
    });

    // Live Classes Count
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setStats(prev => ({ ...prev, classes: snap.size }));
    });

    return () => {
      unsubUsers();
      unsubPending();
      unsubClasses();
    };
  }, []);

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Greeting Header - Matching Native Android */}
      <div className="bg-secondary/40 p-6 rounded-[28px] border border-border/50 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Welcome, {user?.displayName || user?.name || 'Admin'}!</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Control Terminal Access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="System Approvals" value={stats.pending} icon={UserCheck} color="orange" delay={0} />
        <StatCard title="Total Registered" value={stats.users} icon={Users} color="blue" delay={0.1} />
        <StatCard title="Classroom Feeds" value={stats.classes} icon={GraduationCap} color="green" delay={0.2} />
      </div>

      <div className="flex justify-center pt-8">
        <Link to="/admin" className="w-full max-w-sm">
          <Button size="lg" className="w-full h-14 rounded-full font-black text-xs uppercase tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all">
            Launch Admin Panel <Shield className="w-4.5 h-4.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { data, history, isRefreshing, fetchData } = useClassroomData(user?.id);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const touchStartY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) {
      touchStartY.current = null;
      return;
    }
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPulling(true);
      // Apply resistance: sqrt curve for natural feel
      setPullY(Math.min(Math.sqrt(delta) * 5, PTR_THRESHOLD + 20));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pulling && pullY >= PTR_THRESHOLD) {
      fetchData(true);
    }
    setPulling(false);
    setPullY(0);
    touchStartY.current = null;
  }, [pulling, pullY, fetchData]);

  const spinnerOpacity = Math.min(pullY / PTR_THRESHOLD, 1);
  const spinnerRotation = (pullY / PTR_THRESHOLD) * 180;

  return (
    <div
      ref={containerRef}
      className="space-y-6 animate-slide-up relative pb-10"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: pullY > 0 ? pullY : isRefreshing ? PTR_THRESHOLD : 0,
          opacity: pullY > 0 ? spinnerOpacity : isRefreshing ? 1 : 0,
        }}
      >
        <RefreshCw
          className="w-6 h-6 text-primary"
          style={{
            transform: isRefreshing ? undefined : `rotate(${spinnerRotation}deg)`,
            animation: isRefreshing ? 'ptr-rotate 0.7s linear infinite' : undefined,
          }}
        />
      </div>

      {/* Greeting Header - Matching Native Android Branding */}
      <div className="bg-secondary/40 p-8 rounded-[32px] border border-border/50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-14 rounded-[20px] bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
             <Activity className="w-8 h-8 -rotate-3 transition-transform" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Welcome, {user?.displayName || user?.name || 'Teacher'}!</h2>
            <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-[0.2em] mt-1 opacity-70 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Engagement Sync
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-background border border-border/40 shadow-sm text-foreground hover:bg-secondary active:scale-90 transition-all group"
          aria-label="Refresh data"
        >
           <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Students"
          value={data?.total_students ?? '—'}
          icon={Users}
          color="blue"
          subtitle="Enrolled"
          delay={0}
        />
        <StatCard
          title="Attentive"
          value={data?.attentive ?? '—'}
          icon={UserCheck}
          color="green"
          subtitle="Focused"
          delay={0.1}
        />
        <StatCard
          title="Distracted"
          value={data?.distracted ?? '—'}
          icon={AlertTriangle}
          color="orange"
          subtitle="Looking Away"
          delay={0.2}
        />
        <StatCard
          title="Sleepy"
          value={data?.sleepy ?? '—'}
          icon={Moon}
          color="purple"
          subtitle="Eyes Closed"
          delay={0.3}
        />
      </div>

      {/* Gauge + Chart with Native-like Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-[32px] border border-border/50 p-6 flex flex-col items-center justify-center shadow-sm">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Classroom Focus Index</p>
           <AttentionGauge percentage={data?.attention_percentage ?? 0} />
        </div>
        <div className="lg:col-span-2 bg-card rounded-[32px] border border-border/50 p-6 shadow-sm overflow-hidden">
           <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Timeline</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[8px] font-black text-green-600 uppercase">Live Update</span>
              </div>
           </div>
           <AttentionChart data={history} />
        </div>
      </div>
    </div>
  );
}
