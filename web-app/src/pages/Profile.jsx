import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, Calendar, LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsDeleting(true);
    try {
      const uid = currentUser.uid;

      // 1. Delete from Firestore first
      await deleteDoc(doc(db, 'users', uid));

      // 2. Delete from Authentication
      await deleteUser(currentUser);

      toast({
        title: "Account Deleted",
        description: "Your account and data have been permanently removed.",
      });

      // Local cleanup will be handled by the auth state observer in AuthContext
    } catch (error) {
      console.error('Account deletion failed:', error);

      let errorMessage = "Failed to delete account.";
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security, you must have logged in recently to delete your account. Please sign out and sign in again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-14 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] gap-3 active:scale-95 transition-all mt-2"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-destructive hover:bg-destructive/10 text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-xl font-black tracking-tight">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                  This will permanently delete your account and remove all of your data from our servers.
                  <span className="block mt-2 font-bold text-destructive underline">This action cannot be undone.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-2xl font-bold">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteAccount();
                  }}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl font-bold"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
