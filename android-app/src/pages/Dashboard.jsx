import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, Moon, RefreshCw, Camera, CameraOff, Eye, GraduationCap, Shield } from 'lucide-react';
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

  const handleEnroll = async (classId) => {
    try {
      await updateDoc(doc(db, 'classes', classId), {
        students: arrayUnion(user.id)
      });
      toast({ title: "Enrolled", description: "You have successfully enrolled in the class." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to enroll.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground italic">Hello, {user?.displayName || user?.name || 'Student'}</h1>
        <p className="text-sm text-muted-foreground">Manage your classes and monitoring</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Classes you are currently enrolled in</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">You are not enrolled in any classes yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {enrolledClasses.map(cls => (
                  <div key={cls.id} className="p-4 bg-secondary/30 rounded-xl border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-bold text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">Teacher: {cls.teacherName}</p>
                      </div>
                    </div>
                    <Link to="/camera">
                      <Button size="sm" className="gap-2">
                        <Camera className="w-4 h-4" /> Start Monitoring
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Classes</CardTitle>
            <CardDescription>Enroll in a class to start your attention monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.filter(c => !enrolledClasses.some(ec => ec.id === c.id)).map(cls => (
                <div key={cls.id} className="p-4 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">Teacher: {cls.teacherName}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEnroll(cls.id)}>
                    Enroll Now
                  </Button>
                </div>
              ))}
              {classes.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center col-span-full">No classes available.</p>}
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
    <div className="space-y-6 animate-slide-up">
      <h1 className="text-2xl font-extrabold italic">Hello, {user?.displayName || user?.name || 'Admin'}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pending Approvals" value={stats.pending} icon={UserCheck} color="orange" delay={0} />
        <StatCard title="Total Users" value={stats.users} icon={Users} color="blue" delay={0.1} />
        <StatCard title="Total Classes" value={stats.classes} icon={GraduationCap} color="green" delay={0.2} />
      </div>
      <div className="flex justify-center mt-8">
        <Link to="/admin">
          <Button size="lg" className="gap-2">
            Go to Admin Panel <Shield className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { data, history, lastUpdate, isRefreshing, fetchData } = useClassroomData(2000);

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
      className="space-y-6 animate-slide-up relative"
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground italic">Hello, {user?.displayName || user?.name || 'Teacher'}</h1>
          <p className="text-sm text-muted-foreground mt-1">Classroom monitoring overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Total Students"
          value={data?.total_students ?? '—'}
          icon={Users}
          color="blue"
          subtitle="In class"
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
          subtitle="Needs attention"
          delay={0.2}
        />
        <StatCard
          title="Sleepy"
          value={data?.sleepy ?? '—'}
          icon={Moon}
          color="purple"
          subtitle="Low engagement"
          delay={0.3}
        />
      </div>

      {/* Gauge + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AttentionGauge percentage={data?.attention_percentage ?? 0} />
        <div className="lg:col-span-2">
          <AttentionChart data={history} />
        </div>
      </div>
    </div>
  );
}
