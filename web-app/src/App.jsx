import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import UserPendingApproval from '@/components/UserPendingApproval';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Alerts from '@/pages/Alerts';
import Students from '@/pages/Students';
import Reports from '@/pages/Reports';
import Splash from '@/pages/Splash';
import CameraMonitor from '@/pages/CameraMonitor';
import AdminPanel from '@/pages/AdminPanel';
import Security from '@/pages/Security';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import { ThemeProvider } from '@/lib/ThemeContext';
import { SnapshotProvider } from '@/lib/SnapshotContext';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -20, opacity: 0 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, authError } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading Smart Classroom...</p>
        </div>
      </div>
    );
  }

  // Handle specific auth errors
  if (authError) {
    // Blocking auth error display removed
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Layout */}
        <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/splash" replace />}>
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/alerts" element={<PageTransition><Alerts /></PageTransition>} />
          <Route path="/students" element={<PageTransition><Students /></PageTransition>} />
          <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
          <Route path="/camera" element={<PageTransition><CameraMonitor /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminPanel /></PageTransition>} />
          <Route path="/security" element={<PageTransition><Security /></PageTransition>} />
        </Route>

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SnapshotProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
      </SnapshotProvider>
    </ThemeProvider>
  )
}

export default App;
