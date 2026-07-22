import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, Moon, RefreshCw, Camera, GraduationCap, Shield, Activity, TrendingUp } from 'lucide-react';
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

// ── STUDENT DASHBOARD ──
function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const q = query(collection(db, 'classes'), where('students', 'array-contains', user.id));
    const unsubEnrolled = onSnapshot(q, (snapshot) => {
      setEnrolledClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClasses();
      unsubEnrolled();
    };
  }, [user?.id]);

  const handleEnroll = async (classId) => {
    try {
      await updateDoc(doc(db, 'classes', classId), {
        students: arrayUnion(user.id)
      });
      toast({ title: "Enrolled Successfully", description: "You are now part of the classroom feed." });
    } catch (error) {
      toast({ title: "Enrollment Failed", description: "Please check your network connection.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Hello Greeting Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-[28px] border border-primary/10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Hello, {user?.displayName || user?.name || 'Student'}!</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Let's check your enrolled attention feeds</p>
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
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/55 rounded-2xl p-4 bg-secondary/15">
                <p className="text-xs font-bold leading-normal">You are not enrolled in any classes yet.</p>
                <p className="text-[10px] opacity-75 mt-1">Select a class from the options below to register.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledClasses.map(cls => (
                  <div key={cls.id} className="p-4 bg-secondary/35 rounded-2xl border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                      <Button className="w-full sm:w-auto h-12 rounded-full font-black text-xs uppercase tracking-wider gap-2 shadow-md shadow-primary/15">
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
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Available Classes</CardTitle>
            <CardDescription className="text-xs font-medium">Enroll to enable your real-time attention tracking</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-4 sm:px-6">
            <div className="space-y-3">
              {classes.filter(c => !enrolledClasses.some(ec => ec.id === c.id)).map(cls => (
                <div key={cls.id} className="p-4 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-foreground">{cls.name}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold">Teacher: {cls.teacherName}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEnroll(cls.id)} className="h-10 rounded-full font-bold px-4 text-xs border-primary/25 hover:border-primary/50 text-primary">
                    Enroll
                  </Button>
                </div>
              ))}
              {classes.filter(c => !enrolledClasses.some(ec => ec.id === c.id)).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No other classes available at this time.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD SUMMARY ──
function AdminDashboardSummary() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, users: 0, classes: 0 });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    const qPending = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubPending = onSnapshot(qPending, (snap) => {
      setStats(prev => ({ ...prev, pending: snap.size }));
    });

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
      {/* Hello Greeting Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-[28px] border border-primary/10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Hello, {user?.displayName || user?.name || 'Admin'}!</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Control panel & pending registration approvals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pending Registrations" value={stats.pending} icon={UserCheck} color="orange" delay={0} />
        <StatCard title="Registered Users" value={stats.users} icon={Users} color="blue" delay={0.1} />
        <StatCard title="Active Classes" value={stats.classes} icon={GraduationCap} color="green" delay={0.2} />
      </div>

      <div className="flex justify-center pt-4">
        <Link to="/admin" className="w-full max-w-sm">
          <Button className="w-full h-14 rounded-full font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-primary/25">
            Launch Admin Panel <Shield className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── TEACHER DASHBOARD ──
function TeacherDashboard() {
  const { user } = useAuth();
  const { data, history, isRefreshing, fetchData } = useClassroomData(2000);

  // Pull-to-refresh states
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

      {/* Greeting Header Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 rounded-[28px] border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Hello, {user?.displayName || user?.name || 'Teacher'}!</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time classroom engagement overview</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-foreground shrink-0"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid - 4 metric cards */}
      <div className="grid grid-cols-2 gap-3.5">
        <StatCard
          title="Total Students"
          value={data?.total_students ?? '—'}
          icon={Users}
          color="blue"
          subtitle="Registered"
          delay={0}
        />
        <StatCard
          title="Attentive"
          value={data?.attentive ?? '—'}
          icon={UserCheck}
          color="green"
          subtitle="Focused"
          delay={0.05}
        />
        <StatCard
          title="Distracted"
          value={data?.distracted ?? '—'}
          icon={AlertTriangle}
          color="orange"
          subtitle="Needs Attention"
          delay={0.1}
        />
        <StatCard
          title="Sleepy"
          value={data?.sleepy ?? '—'}
          icon={Moon}
          color="purple"
          subtitle="Drowsy Feed"
          delay={0.15}
        />
      </div>

      {/* 5th Metric Card: Attention Score Card (Material Design 3 card style) */}
      <div className="rounded-[28px] bg-card border border-border/50 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-auto flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">Classroom Attention Score</span>
          </div>
          <p className="text-xs text-muted-foreground leading-normal mb-4 font-medium">
            This metric calculates the overall attentive ratio based on active live device monitoring tracking.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase px-3 py-1 bg-secondary rounded-full border border-border/50 text-foreground">
              Live Index
            </span>
            <span className="text-[11px] text-green-600 font-black animate-pulse">
              ● Active Sync
            </span>
          </div>
        </div>
        <div className="w-full md:w-auto shrink-0 flex justify-center">
          <AttentionGauge percentage={data?.attention_percentage ?? 0} />
        </div>
      </div>

      {/* Attention Chart Container */}
      <div className="rounded-[28px] overflow-hidden bg-card shadow-sm border border-border/50 p-4">
        <AttentionChart data={history} />
      </div>
    </div>
  );
}
