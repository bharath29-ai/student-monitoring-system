import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { SnapshotProvider } from '@/lib/SnapshotContext';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Alerts from '@/pages/Alerts';
import Students from '@/pages/Students';
import Reports from '@/pages/Reports';
import Splash from '@/pages/Splash';
import CameraMonitor from '@/pages/CameraMonitor';
import AdminPanel from '@/pages/AdminPanel';
import Profile from '@/pages/Profile';
import Security from '@/pages/Security';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/splash" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/students" element={<Students />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/camera" element={<CameraMonitor />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/security" element={<Security />} />
      </Route>

      <Route path="/" element={<Navigate to="/splash" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
