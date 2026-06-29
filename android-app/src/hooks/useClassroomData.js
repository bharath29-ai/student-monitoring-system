import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

export default function useClassroomData() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 1. Listen to the latest live status
    const statusDoc = doc(db, 'classroom', 'current_status');
    const unsubStatus = onSnapshot(statusDoc, (docSnap) => {
      if (docSnap.exists()) {
        const statusData = docSnap.data();
        setData(statusData);
        setIsConnected(true);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    }, (error) => {
      console.error("Firestore status error:", error);
      setIsConnected(false);
    });

    // 2. Listen to historical data for the chart
    const historyQuery = query(
      collection(db, 'classroom_history'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );

    const unsubHistory = onSnapshot(historyQuery, (querySnapshot) => {
      const historyItems = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        historyItems.unshift({
          time: item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '',
          attention: item.attention_percentage,
          attentive: item.attentive,
          distracted: item.distracted,
          sleepy: item.sleepy,
        });
      });
      setHistory(historyItems);
    });

    return () => {
      unsubStatus();
      unsubHistory();
    };
  }, []);

  const fetchData = async () => {
    // With Firebase real-time listeners, we don't strictly need a "fetch" function,
    // but we can leave it as a placeholder for manual refresh triggers if needed.
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return { data, history, lastUpdate, isConnected, isRefreshing, fetchData };
}
