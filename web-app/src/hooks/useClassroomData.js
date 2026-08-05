import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { onSnapshot, collection, query, orderBy, limit, where } from 'firebase/firestore';

/**
 * useClassroomData - Advanced Synchronization Engine
 * Handles the "Hybrid Roster": Official assignments + Live auto-discovery.
 */
export default function useClassroomData(teacherId = null) {
  const [state, setState] = useState({
    roster: [],
    stats: {
      total_students: 0,
      active_now: 0,
      attentive: 0,
      distracted: 0,
      sleepy: 0,
      attention_percentage: 100
    },
    studentStatuses: {},
    history: [],
    isRefreshing: false
  });

  useEffect(() => {
    if (!teacherId) return;

    // 1. Sync Official Roster (Users who have this teacherId)
    const qRoster = query(
      collection(db, 'users'),
      where('teacherId', '==', teacherId),
      where('role', '==', 'student')
    );

    const unsubRoster = onSnapshot(qRoster, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(prev => ({
        ...prev,
        roster: list,
        stats: { ...prev.stats, total_students: list.length }
      }));
    });

    // 2. Sync Live Behavior (Reports sent to this teacherId)
    const qReports = query(
      collection(db, 'reports'),
      where('teacherId', '==', teacherId),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubReports = onSnapshot(qReports, (snap) => {
      const reports = snap.docs.map(doc => doc.data());
      const latestMap = {};
      const nowMs = Date.now();
      const STALE_LIMIT = 180000; // 3 minutes

      reports.forEach(r => {
        const sId = r.studentId || r.uid;
        const rTime = r.timestamp?.toMillis ? r.timestamp.toMillis() : 0;

        if (sId && !latestMap[sId] && (nowMs - rTime < STALE_LIMIT)) {
          latestMap[sId] = {
            status: r.status || 'attentive',
            score: r.score || r.attention_score || 0,
            timestamp: r.timestamp,
            name: r.studentName,
            email: r.studentEmail || ''
          };
        }
      });

      const activeList = Object.values(latestMap);
      const newStats = {
        active_now: activeList.length,
        attentive: activeList.filter(a => a.status?.toLowerCase() === 'attentive').length,
        distracted: activeList.filter(a => a.status?.toLowerCase() === 'distracted').length,
        sleepy: activeList.filter(a => a.status?.toLowerCase() === 'sleepy').length,
      };

      const totalScore = activeList.reduce((sum, a) => sum + (a.score || 0), 0);
      newStats.attention_percentage = activeList.length > 0 ? Math.round(totalScore / activeList.length) : 100;

      setState(prev => ({
        ...prev,
        studentStatuses: latestMap,
        stats: { ...prev.stats, ...newStats }
      }));
    }, (err) => {
      console.error("Reports Sync Error:", err);
    });

    // 3. Sync History (Teacher-specific trend)
    const qHistory = query(
      collection(db, 'classroom_history'),
      where('teacherId', '==', teacherId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const items = snap.docs.map(doc => {
        const d = doc.data();
        return {
          time: d.timestamp?.toDate ? d.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          attention: d.attention_percentage
        };
      }).reverse();
      setState(prev => ({ ...prev, history: items }));
    });

    return () => {
      unsubRoster();
      unsubReports();
      unsubHistory();
    };
  }, [teacherId]);

  return {
    data: state.stats,
    studentStatuses: state.studentStatuses,
    assignedStudents: state.roster,
    history: state.history,
    isRefreshing: state.isRefreshing,
    fetchData: () => {
      setState(prev => ({ ...prev, isRefreshing: true }));
      setTimeout(() => setState(prev => ({ ...prev, isRefreshing: false })), 600);
    }
  };
}
