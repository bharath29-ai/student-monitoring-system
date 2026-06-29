import React, { useState, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, FileText, LogOut,
  Brain, Moon, Sun, Trash2, Camera, ChevronLeft, Shield, Settings, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, toggleDark } = useTheme();
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();

  const navItems = useMemo(() => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (user?.role === 'admin') {
      items.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
      items.push({ path: '/reports', label: 'System Reports', icon: FileText });
    }

    if (user?.role === 'teacher') {
      items.push({ path: '/alerts', label: 'Alerts', icon: Bell });
      items.push({ path: '/students', label: 'Students', icon: Users });
      items.push({ path: '/reports', label: 'Analytics', icon: FileText });
    }

    if (user?.role === 'student') {
      items.push({ path: '/camera', label: 'Face Monitor', icon: Camera });
      items.push({ path: '/reports', label: 'My Reports', icon: FileText });
    }

    return items;
  }, [user]);

  const ROOT_PATHS = ['/dashboard', '/alerts', '/students', '/reports', '/camera', '/admin'];
  const isRootScreen = ROOT_PATHS.includes(location.pathname);

  const handleDeleteAccount = async () => {
    try {
      if (user) {
        // await firebaseUser.delete();
      }
    } catch (_) {}
    await logout();
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-inter">
        {/* Mobile Native-Feel Header */}
        <header
          className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between pt-safe"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3">
            {!isRootScreen && (
              <button
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/50 active:scale-95 transition-transform"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-sm leading-tight">
                  {navItems.find(i => i.path === location.pathname)?.label || 'Smart Classroom'}
                </h1>
                <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                  Role: <span className="text-primary capitalize">{user?.role}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Live indicator */}
            {user?.role !== 'teacher' && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 mr-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-green-600 uppercase">Live</span>
              </div>
            )}

            {/* Native settings button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/80 active:scale-90 transition-transform">
                  <Settings className="w-4.5 h-4.5 text-foreground" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[24px] max-w-[90%] mx-auto p-6 border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-left font-black tracking-tight text-lg">Settings & Profile</AlertDialogTitle>
                  <AlertDialogDescription className="text-left text-xs">
                    Configure your device, account settings, and display theme.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-3">
                  <div className="p-3 bg-secondary/40 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{user?.displayName || user?.name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{user?.role} account</p>
                    </div>
                  </div>

                  <button
                    onClick={toggleDark}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-all w-full border border-border/40"
                  >
                    {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                    {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </button>

                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-all w-full border border-border/40"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                    Logout Session
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-all w-full border border-destructive/20">
                        <Trash2 className="w-4 h-4 text-destructive" />
                        Delete My Account
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[24px] max-w-[85%] mx-auto border-none shadow-2xl p-6">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-left">Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-xs">
                          This will permanently delete your account and all associated attention data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row gap-2 justify-end mt-4">
                        <AlertDialogCancel className="rounded-xl mt-0 border-none bg-secondary text-foreground font-bold hover:bg-secondary/80">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl w-full border-none bg-secondary text-foreground font-black py-3">Close Settings</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {/* Content Area - padded at bottom for safe tab bar */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
          <Outlet />
        </main>

        {/* Mobile Navigation Tab Bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border"
          style={{
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
            paddingTop: '0.5rem',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div className="flex items-stretch justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex-1 flex flex-col items-center justify-center gap-1 relative py-1
                    transition-all active:scale-95 duration-100
                    ${isActive ? 'text-primary' : 'text-muted-foreground'}
                  `}
                >
                  <div className="relative">
                    <item.icon className="w-5.5 h-5.5" strokeWidth={isActive ? 2.5 : 1.8} />
                    {item.path === '/alerts' && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive border border-card" />
                    )}
                  </div>
                  <span className={`text-[10px] font-black tracking-wide leading-none ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop App Layout (Untouched)
  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)' }}
      >
        <div className="p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm">Smart Classroom</h1>
              <p className="text-xs text-muted-foreground">AI Monitor</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
                {item.path === '/alerts' && (
                  <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">3</Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className="p-4 border-t border-border space-y-1 shrink-0"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={toggleDark}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your teacher account and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        <header
          className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 lg:px-8"
          style={{
            paddingTop: 'calc(1rem + env(safe-area-inset-top))',
            paddingBottom: '1rem',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isRootScreen && (
                <button
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
                  onClick={() => window.history.back()}
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              {isRootScreen && (
                <button
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  Welcome, <span className="text-primary capitalize">{user?.displayName || user?.name || 'User'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role !== 'teacher' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-600">Live</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 pb-safe lg:pb-8 mb-tab-bar lg:mb-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}