import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, Calendar, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col items-center justify-center pt-6 pb-2">
        <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center shadow-xl mb-4 relative">
          <User className="w-12 h-12 text-primary" />
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-background rounded-full" />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">{user?.displayName || user?.name || 'User Profile'}</h2>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1">
          {user?.role} Account
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="rounded-[28px] border-border/50 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-2xl border border-border/40">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Address</p>
                <p className="text-sm font-bold text-foreground truncate">{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-2xl border border-border/40">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">User ID</p>
                <p className="text-xs font-mono font-bold text-foreground truncate">{user?.id || user?.uid || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-2xl border border-border/40">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Member Since</p>
                <p className="text-sm font-bold text-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full h-14 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] gap-3 shadow-lg shadow-destructive/10 active:scale-95 transition-all mt-4"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
