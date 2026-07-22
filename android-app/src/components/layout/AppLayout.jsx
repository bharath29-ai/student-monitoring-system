import React, { useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, FileText, Camera, User, ChevronLeft, Shield, Scan
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useClassroomData from '@/hooks/useClassroomData';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useClassroomData(3000); // Poll for live alert badges

  // Dynamic tab routing map based on user role
  const bottomTabs = useMemo(() => {
    if (!user) return [];

    const tabs = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        // Monitor tab: students see camera preview, teachers/admins see student grid
        path: user.role === 'student' ? '/camera' : '/students',
        label: 'Monitor',
        icon: user.role === 'student' ? Camera : Users,
      },
      {
        path: '/reports',
        label: 'Reports',
        icon: FileText,
      },
      {
        path: '/alerts',
        label: 'Alerts',
        icon: Bell,
      },
      {
        path: '/profile',
        label: 'Profile',
        icon: User,
      }
    ];

    return tabs;
  }, [user]);

  // Determine current screen title
  const currentTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/camera') return 'Face Monitor';
    if (path === '/students') return 'Class Monitor';
    if (path === '/reports') return 'Reports';
    if (path === '/alerts') return 'Alerts';
    if (path === '/profile') return 'Profile';
    if (path === '/admin') return 'Admin Panel';
    if (path === '/security') return 'Security';
    return 'Smart Classroom';
  }, [location.pathname]);

  // Root screen check to show/hide back button
  const isRootScreen = useMemo(() => {
    const rootPaths = ['/dashboard', '/camera', '/students', '/reports', '/alerts', '/profile'];
    return rootPaths.includes(location.pathname);
  }, [location.pathname]);

  // Dynamic notifications count based on live distracted + sleepy counts
  const alertBadgeCount = useMemo(() => {
    if (!data) return 0;
    return (data.distracted || 0) + (data.sleepy || 0);
  }, [data]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col font-inter selection:bg-primary/20">
      {/* ──── Android Native Material You Top App Bar ──── */}
      <header
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center justify-between pt-safe shrink-0 shadow-sm"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          {/* Back button for secondary screens */}
          {!isRootScreen && (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 active:scale-90 transition-all text-foreground"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
          
          <div className="flex flex-col">
            <h1 className="font-bold text-lg text-foreground tracking-tight leading-tight">
              {currentTitle}
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
              Role: <span className="text-primary font-black">{user.role}</span>
            </p>
          </div>
        </div>

        {/* Top App Bar Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick status indicator */}
          {user.role !== 'teacher' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mr-1 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-black text-green-600 uppercase tracking-wider">Live Link</span>
            </div>
          )}

          {/* Quick Admin Shortcut (Only shown for Admin roles) */}
          {user.role === 'admin' && location.pathname !== '/admin' && (
            <Link
              to="/admin"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-90 transition-all"
              title="Admin Panel"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}

          {/* Alerts quick-shortcut bell (Only if not already on alerts page) */}
          {location.pathname !== '/alerts' && (
            <Link
              to="/alerts"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 active:scale-90 transition-all relative text-foreground"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {alertBadgeCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-black flex items-center justify-center border-2 border-background animate-bounce">
                  {alertBadgeCount}
                </span>
              )}
            </Link>
          )}

          {/* Profile Circle Avatar quick-shortcut */}
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center active:scale-90 transition-all overflow-hidden"
            aria-label="Profile"
          >
            <User className="w-5 h-5 text-primary" />
          </Link>
        </div>
      </header>

      {/* ──── Content Area (Scrollable body) ──── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <Outlet />
      </main>

      {/* ──── Android Native Material Design 3 Bottom Navigation Bar ──── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl shrink-0"
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          paddingTop: '0.75rem',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          {bottomTabs.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center relative active:scale-95 transition-all duration-150"
              >
                {/* Active Pill Indicator around the Icon */}
                <div className={`relative px-6 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary/40'
                }`}>
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                  
                  {/* Notifications Red Dot Badge on alerts icon */}
                  {item.path === '/alerts' && alertBadgeCount > 0 && (
                    <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-destructive border border-background animate-pulse" />
                  )}
                </div>

                {/* Tab Label Text */}
                <span className={`text-[11px] font-bold mt-1 tracking-wide transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}