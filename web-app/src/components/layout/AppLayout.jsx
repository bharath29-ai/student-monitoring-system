import React, { useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, FileText,
  Moon, Sun, Camera, ChevronLeft, Shield, User, Activity
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';

export default function AppLayout() {
  const location = useLocation();
  const { dark, toggleDark } = useTheme();
  const { user } = useAuth();

  const navItems = useMemo(() => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];
    if (user?.role === 'admin') {
      items.push({ path: '/admin', label: 'Admin', icon: Shield });
      items.push({ path: '/reports', label: 'Reports', icon: FileText });
    }
    if (user?.role === 'teacher') {
      items.push({ path: '/alerts', label: 'Alerts', icon: Bell });
      items.push({ path: '/students', label: 'Students', icon: Users });
      items.push({ path: '/reports', label: 'Analytics', icon: FileText });
    }
    if (user?.role === 'student') {
      items.push({ path: '/camera', label: 'Monitor', icon: Camera });
      items.push({ path: '/reports', label: 'Reports', icon: FileText });
    }
    return items;
  }, [user]);

  const currentTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/camera') return 'Face Monitor';
    if (path === '/students') return 'Class Monitor';
    if (path === '/reports') return 'Reports';
    if (path === '/alerts') return 'Alerts';
    if (path === '/profile') return 'Profile';
    if (path === '/admin') return 'Admin Panel';
    return 'Smart Classroom';
  }, [location.pathname]);

  const isRootScreen = ['/dashboard', '/alerts', '/students', '/reports', '/camera', '/admin', '/profile'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col font-inter">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {!isRootScreen && (
            <button onClick={() => window.history.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="font-bold text-base text-foreground leading-tight">{currentTitle}</h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{user?.role || 'User'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleDark} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-foreground">
            {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/profile" className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
            <User className="w-4 h-4 text-primary" />
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center justify-center transition-all">
                <div className={`px-5 py-1 rounded-full transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
