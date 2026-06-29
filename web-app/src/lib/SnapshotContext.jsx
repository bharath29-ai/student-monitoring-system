import React, { createContext, useContext, useState } from 'react';

const SnapshotContext = createContext(null);

export function SnapshotProvider({ children }) {
  const [snapshots, setSnapshots] = useState([]); // { id, snapshot, label, time, attention }

  const addSnapshot = (snap) => {
    setSnapshots(prev => [snap, ...prev].slice(0, 20));
  };

  const clearSnapshots = () => setSnapshots([]);

  return (
    <SnapshotContext.Provider value={{ snapshots, addSnapshot, clearSnapshots }}>
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshots() {
  return useContext(SnapshotContext);
}