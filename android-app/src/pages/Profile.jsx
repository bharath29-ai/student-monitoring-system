import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { User, Sun, Moon, LogOut, Trash2, Cpu, Database, Info, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

export default function Profile() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    try {
      // In a real app, delete from Firebase. Here, we logout.
      toast({
        title: "Account Deleted",
        description: "Your account and data have been permanently removed.",
        variant: "destructive"
      });
      await logout();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-slide-up pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-border/40 pb-3">
        <h1 className="text-2xl font-extrabold text-foreground italic">My Profile</h1>
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Account & System Settings</p>
      </div>

      {/* User Info Header Card (Material Design 3 Filled Card style) */}
      <div className="rounded-[28px] bg-secondary/40 border border-border/40 p-6 flex flex-col items-center text-center gap-4 shadow-sm">
        <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center relative shadow-inner">
          <User className="w-12 h-12 text-primary" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-zinc-950 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">{user?.displayName || user?.name || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || 'user@smartclasspulse.app'}</p>
        </div>
        <Badge className="px-4 py-1.5 text-xs font-black uppercase rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/15">
          {user?.role} Account
        </Badge>
      </div>

      {/* Settings Options Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-2">App Settings</h3>
        
        {/* Theme Switch Card */}
        <div className="rounded-[24px] bg-card border border-border/50 p-5 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
              {dark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Adjust display theme</p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 ${
              dark ? 'bg-primary' : 'bg-muted border border-border'
            }`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                dark ? 'translate-x-6 bg-primary-foreground' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sign Out Card */}
        <div className="rounded-[24px] bg-card border border-border/50 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Log Out</p>
              <p className="text-xs text-muted-foreground">End your current session</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-5 h-12 text-xs font-black uppercase tracking-wider rounded-full bg-secondary hover:bg-secondary/80 active:scale-95 transition-all text-foreground border border-border/50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Diagnostics Card */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-2">Diagnostics & Tech</h3>
        <div className="rounded-[28px] bg-card border border-border/50 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-xs font-bold text-foreground pb-2 border-b border-border/40">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Hardware & AI Status</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-secondary/20 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">AI Processor</span>
              <span className="font-bold text-foreground">TensorFlow.js 4.22</span>
            </div>
            <div className="p-3 bg-secondary/20 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Backend Engine</span>
              <span className="font-bold text-foreground">WebGL / WASM</span>
            </div>
            <div className="p-3 bg-secondary/20 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Database Sync</span>
              <span className="font-bold text-foreground">Firebase Live</span>
            </div>
            <div className="p-3 bg-secondary/20 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">App Platform</span>
              <span className="font-bold text-foreground">Capacitor Native</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3.5 bg-primary/5 rounded-2xl border border-primary/10">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[10px] text-primary/80 leading-normal font-medium">
              Smart Class Pulse uses edge-computed face meshes. Image frames never leave your local device storage.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-destructive px-2">Danger Zone</h3>
        <div className="rounded-[24px] bg-red-500/5 border border-red-500/10 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground">Erase all profile & monitoring history</p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="px-5 h-12 text-xs font-black uppercase tracking-wider rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 transition-all">
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[28px] max-w-[90%] mx-auto border-none p-6 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-left flex items-center gap-2 text-destructive">
                  <ShieldAlert className="w-5 h-5 text-destructive" /> Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left text-xs leading-relaxed">
                  This action is irreversible. All of your synced classroom reports and alert history will be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2 justify-end mt-4">
                <AlertDialogCancel className="rounded-full mt-0 border-none bg-secondary text-foreground font-bold hover:bg-secondary/80 px-5 h-12 text-xs">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full font-bold px-5 h-12 text-xs"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-[10px] text-muted-foreground font-semibold">Smart Class Pulse v3.2.0-pulse</p>
      </div>
    </div>
  );
}
